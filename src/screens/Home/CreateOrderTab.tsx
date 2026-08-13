import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppDialog } from '../../components/AppDialog';
import { AppDropdown } from '../../components/AppDropdown';
import type { AppDropdownOption } from '../../components/AppDropdown';
import { AppTextField } from '../../components/AppTextField';
import { BrandBackdrop } from '../../components/BrandBackdrop';
import { InlineAlert } from '../../components/InlineAlert';
import { LiveOrderTracker } from '../../components/LiveOrderTracker';
import { MotoLoader } from '../../components/MotoLoader';
import { PhoneField } from '../../components/PhoneField';
import type { CompletePhone } from '../../components/PhoneField';
import { customersApi, ordersApi, toApiError } from '../../api';
import type {
  CustomerAddress,
  OrderDocument,
  OrderDocumentStatus,
} from '../../api';
import { DEFAULT_COUNTRY_CODE, getCountry } from '../../data';
import type { Country } from '../../data';
import { colors } from '../../theme';
import { useDropoffZones } from '../../hooks/useDropoffZones';
import { useEntranceAnimation } from '../../hooks/useEntranceAnimation';
import { useIsMounted } from '../../hooks/useIsMounted';
import { useOrderTracking } from '../../hooks/useOrderTracking';
import { toE164, validateNationalNumber } from '../../utils/phone';
import { styles } from './CreateOrderTab.styles';

const ENTRANCE_GROUPS = 3;

const SUCCESS_VISIBLE_MS = 4000;

const ADD_NEW_ADDRESS = '__new__';

const EMPTY_FORM = {
  customerPhoneNumber: '',
  customerName: '',
  description: '',
  googleMapsLink: '',
  zoneId: '',
  note: '',
};

type FormValues = typeof EMPTY_FORM;
type FormField = keyof FormValues;
type FormErrors = Partial<Record<FormField, string>>;
type Validator = (value: string, values: FormValues) => string | undefined;

type LookupStatus = 'idle' | 'loading' | 'found' | 'notFound' | 'error';

const validatePhone: Validator = value => validateNationalNumber(value);

const validateName: Validator = value =>
  value.trim() ? undefined : 'Tell us who is receiving the order.';

const validateDescription: Validator = value =>
  value.trim() ? undefined : 'Give the dropoff address.';

const validateMapsLink: Validator = value => {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Paste the Google Maps link for the dropoff.';
  }
  if (!/^https?:\/\/\S+$/.test(trimmed)) {
    return 'Paste the full link, e.g. https://maps.google.com/?q=33.8938,35.5018.';
  }
  return undefined;
};

const validateZone: Validator = value =>
  value.trim() ? undefined : 'Pick the zone this dropoff falls in.';

const VALIDATORS: Partial<Record<FormField, Validator>> = {
  customerPhoneNumber: validatePhone,
  customerName: validateName,
  description: validateDescription,
  googleMapsLink: validateMapsLink,
  zoneId: validateZone,
};

const validateForm = (values: FormValues): FormErrors => {
  const errors: FormErrors = {};
  (Object.keys(VALIDATORS) as FormField[]).forEach(field => {
    const error = VALIDATORS[field]?.(values[field], values);
    if (error) {
      errors[field] = error;
    }
  });
  return errors;
};

const refreshShownErrors = (
  shown: FormErrors,
  values: FormValues,
): FormErrors => {
  const next: FormErrors = {};
  (Object.keys(shown) as FormField[]).forEach(field => {
    if (!shown[field]) {
      return;
    }
    const error = VALIDATORS[field]?.(values[field], values);
    if (error) {
      next[field] = error;
    }
  });
  return next;
};

export interface CreateOrderTabProps {
  summary: string;
  summaryIsError?: boolean;
  onCreated: () => void;
  onTrackedStatusChange?: (
    status: OrderDocumentStatus,
    order: OrderDocument,
  ) => void;
}

const CreateOrderTabComponent: React.FC<CreateOrderTabProps> = ({
  summary,
  summaryIsError = false,
  onCreated,
  onTrackedStatusChange,
}) => {
  const isMounted = useIsMounted();
  const entrance = useEntranceAnimation(ENTRANCE_GROUPS);
  const [introEntrance, formEntrance, actionsEntrance] = entrance.groups;

  const nameRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const linkRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);

  const {
    zones,
    loading: zonesLoading,
    error: zonesError,
    reload: reloadZones,
  } = useDropoffZones();

  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorContent, setErrorContent] = useState({ title: '', message: '' });
  const [errorVisible, setErrorVisible] = useState(false);

  const [createdOrder, setCreatedOrder] = useState<OrderDocument | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [addressChoice, setAddressChoice] = useState(ADD_NEW_ADDRESS);
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [lookupMessage, setLookupMessage] = useState('');
  const lookupRequestId = useRef(0);

  const tracking = useOrderTracking(createdOrder?._id, {
    seed: createdOrder,
    onStatusChange: onTrackedStatusChange,
  });

  useEffect(() => {
    if (!successMessage) {
      return;
    }
    const timer = setTimeout(() => setSuccessMessage(''), SUCCESS_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const valuesRef = useRef(values);
  valuesRef.current = values;

  const autofilledRef = useRef<Partial<FormValues>>({});

  const applyValues = useCallback((patch: Partial<FormValues>): void => {
    const next = { ...valuesRef.current, ...patch };
    valuesRef.current = next;
    setValues(next);
    setErrors(prev => refreshShownErrors(prev, next));
  }, []);

  const changeHandlers = useMemo(() => {
    const handlers = {} as Record<FormField, (text: string) => void>;
    (Object.keys(EMPTY_FORM) as FormField[]).forEach(field => {
      handlers[field] = (text: string) => {
        const next = { ...valuesRef.current, [field]: text };
        valuesRef.current = next;
        setValues(next);
        setSuccessMessage('');
        setErrors(prev => refreshShownErrors(prev, next));
      };
    });
    return handlers;
  }, []);

  const blurHandlers = useMemo(() => {
    const handlers = {} as Record<FormField, () => void>;
    (Object.keys(EMPTY_FORM) as FormField[]).forEach(field => {
      handlers[field] = () =>
        setErrors(prev => ({
          ...prev,
          [field]: VALIDATORS[field]?.(
            valuesRef.current[field],
            valuesRef.current,
          ),
        }));
    });
    return handlers;
  }, []);

  const handleSubmit = useCallback(async (): Promise<void> => {
    const nextErrors = validateForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSuccessMessage('');
    setSubmitting(true);

    const note = values.note.trim();
    const customerName = values.customerName.trim();
    const description = values.description.trim();
    const googleMapsLink = values.googleMapsLink.trim();
    const zoneId = values.zoneId.trim();

    try {
      const created = await ordersApi.create({
        customerPhoneNumber: toE164(
          getCountry(countryCode).dialCode,
          values.customerPhoneNumber,
        ),
        customerName,
        dropoffLocation: { zoneId, description, googleMapsLink },
        note: note || undefined,
      });
      if (!isMounted()) {
        return;
      }
      setValues(EMPTY_FORM);
      setCountryCode(DEFAULT_COUNTRY_CODE);
      autofilledRef.current = {};
      setSavedAddresses([]);
      setAddressChoice(ADD_NEW_ADDRESS);
      setLookupStatus('idle');
      setLookupMessage('');
      setSuccessMessage('Order created.');
      setCreatedOrder(created);
      onCreated();
    } catch (error) {
      if (!isMounted()) {
        return;
      }
      setErrorContent({
        title: 'Could not create order',
        message: toApiError(error).userMessage,
      });
      setErrorVisible(true);
    } finally {
      if (isMounted()) {
        setSubmitting(false);
      }
    }
  }, [values, countryCode, isMounted, onCreated]);

  const handleCountryChange = useCallback(
    (country: Country) => setCountryCode(country.code),
    [],
  );

  const autofill = useCallback(
    (patch: Partial<FormValues>): void => {
      autofilledRef.current = { ...autofilledRef.current, ...patch };
      applyValues(patch);
    },
    [applyValues],
  );

  const clearAutofill = useCallback((): void => {
    const patch: Partial<FormValues> = {};
    (Object.keys(autofilledRef.current) as FormField[]).forEach(field => {
      if (valuesRef.current[field] === autofilledRef.current[field]) {
        patch[field] = '';
      }
    });
    autofilledRef.current = {};
    if (Object.keys(patch).length > 0) {
      applyValues(patch);
    }
  }, [applyValues]);

  const handlePhoneComplete = useCallback(
    async (phone: CompletePhone): Promise<void> => {
      const requestId = lookupRequestId.current + 1;
      lookupRequestId.current = requestId;
      setSuccessMessage('');
      setLookupStatus('loading');
      setLookupMessage('');

      try {
        const customer = await customersApi.find(phone.e164);
        if (!isMounted() || requestId !== lookupRequestId.current) {
          return;
        }
        if (!customer) {
          clearAutofill();
          setSavedAddresses([]);
          setAddressChoice(ADD_NEW_ADDRESS);
          setLookupStatus('notFound');
          setLookupMessage('New customer — fill in their details below.');
          return;
        }

        const [first] = customer.addresses;
        setSavedAddresses(customer.addresses);
        setAddressChoice(first ? '0' : ADD_NEW_ADDRESS);
        autofill({
          customerName: customer.name,
          description: first?.description ?? '',
          googleMapsLink: first?.googleMapsLink ?? '',
          zoneId: first?.zoneId ?? '',
        });
        setLookupStatus('found');
        setLookupMessage(
          first
            ? `${customer.name} — ${customer.addresses.length} saved address${
                customer.addresses.length === 1 ? '' : 'es'
              }.`
            : `${customer.name} — no saved address yet.`,
        );
      } catch (error) {
        if (!isMounted() || requestId !== lookupRequestId.current) {
          return;
        }
        setLookupStatus('error');
        setLookupMessage(toApiError(error).userMessage);
      }
    },
    [autofill, clearAutofill, isMounted],
  );

  const handleAddressSelect = useCallback(
    (choice: string): void => {
      setAddressChoice(choice);
      setSuccessMessage('');

      if (choice === ADD_NEW_ADDRESS) {
        autofill({ description: '', googleMapsLink: '', zoneId: '' });
        requestAnimationFrame(() => descriptionRef.current?.focus());
        return;
      }

      const address = savedAddresses[Number(choice)];
      if (!address) {
        return;
      }
      autofill({
        description: address.description,
        googleMapsLink: address.googleMapsLink,
        zoneId: address.zoneId,
      });
    },
    [autofill, savedAddresses],
  );

  const dismissError = useCallback(() => setErrorVisible(false), []);

  const handleDismissTracker = useCallback(() => setCreatedOrder(null), []);

  const focusName = useCallback(() => nameRef.current?.focus(), []);
  const focusDescription = useCallback(
    () => descriptionRef.current?.focus(),
    [],
  );
  const focusLink = useCallback(() => linkRef.current?.focus(), []);
  const focusNote = useCallback(() => noteRef.current?.focus(), []);

  const addressOptions = useMemo<AppDropdownOption[]>(
    () => [
      ...savedAddresses.map((address, index) => ({
        value: String(index),
        label: address.description,
      })),
      { value: ADD_NEW_ADDRESS, label: '+ Add a new address' },
    ],
    [savedAddresses],
  );

  const zoneOptions = useMemo<AppDropdownOption[]>(
    () => zones.map(zone => ({ value: zone._id, label: zone.name })),
    [zones],
  );

  const showAddressPicker = savedAddresses.length > 0;
  const typingNewAddress =
    !showAddressPicker || addressChoice === ADD_NEW_ADDRESS;

  const zonePlaceholder = zonesLoading
    ? 'Loading zones…'
    : zoneOptions.length > 0
    ? 'Choose a zone'
    : 'No zones available';

  const zoneErrorStyle = useMemo(
    () => [styles.lookupText, styles.lookupTextError],
    [],
  );

  const lookupTextStyle = useMemo(
    () => [
      styles.lookupText,
      lookupStatus === 'error' ? styles.lookupTextError : null,
      lookupStatus === 'found' ? styles.lookupTextFound : null,
    ],
    [lookupStatus],
  );

  const introStyle = useMemo(
    () => [styles.intro, introEntrance],
    [introEntrance],
  );
  const formStyle = useMemo(() => [styles.form, formEntrance], [formEntrance]);
  const actionsStyle = useMemo(
    () => [styles.actions, actionsEntrance],
    [actionsEntrance],
  );
  const summaryStyle = useMemo(
    () => [styles.meta, summaryIsError ? styles.metaError : null],
    [summaryIsError],
  );

  return (
    <View style={styles.container}>
      <BrandBackdrop />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={introStyle}>
            <Text style={styles.title}>New order</Text>
            <Text style={styles.subtitle}>
              Tell us who's receiving it and where it goes — we'll find the
              nearest driver.
            </Text>
            <Text style={summaryStyle} numberOfLines={1}>
              {summary}
            </Text>
          </Animated.View>

          <Animated.View style={formStyle}>
            <PhoneField
              label="Customer phone"
              value={values.customerPhoneNumber}
              onChangeText={changeHandlers.customerPhoneNumber}
              onBlur={blurHandlers.customerPhoneNumber}
              error={errors.customerPhoneNumber}
              placeholder="70 123 456"
              countryCode={countryCode}
              onCountryChange={handleCountryChange}
              onComplete={handlePhoneComplete}
              returnKeyType="next"
              onSubmitEditing={focusName}
              testID="order-customer-phone"
            />

            {lookupStatus === 'loading' || lookupMessage ? (
              <View style={styles.lookup} testID="order-customer-lookup">
                {lookupStatus === 'loading' ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : null}
                <Text style={lookupTextStyle}>
                  {lookupStatus === 'loading'
                    ? 'Looking this number up…'
                    : lookupMessage}
                </Text>
              </View>
            ) : null}

            <AppTextField
              ref={nameRef}
              label="Customer name"
              value={values.customerName}
              onChangeText={changeHandlers.customerName}
              onBlur={blurHandlers.customerName}
              error={errors.customerName}
              placeholder="Rami Haddad"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={focusDescription}
              testID="order-customer-name"
            />

            {showAddressPicker ? (
              <View style={styles.picker}>
                <Text style={styles.pickerLabel}>Dropoff address</Text>
                <AppDropdown
                  options={addressOptions}
                  value={addressChoice}
                  placeholder="Choose a saved address"
                  onSelect={handleAddressSelect}
                  accessibilityLabel="Dropoff address"
                  testID="order-dropoff-picker"
                />
              </View>
            ) : null}

            {typingNewAddress ? (
              <AppTextField
                ref={descriptionRef}
                label={
                  showAddressPicker ? 'New dropoff address' : 'Dropoff address'
                }
                value={values.description}
                onChangeText={changeHandlers.description}
                onBlur={blurHandlers.description}
                error={errors.description}
                placeholder="Hamra Street, Beirut"
                returnKeyType="next"
                onSubmitEditing={focusLink}
                testID="order-dropoff-description"
              />
            ) : null}

            <AppTextField
              ref={linkRef}
              label="Google Maps link"
              value={values.googleMapsLink}
              onChangeText={changeHandlers.googleMapsLink}
              onBlur={blurHandlers.googleMapsLink}
              error={errors.googleMapsLink}
              placeholder="https://maps.google.com/?q=33.8938,35.5018"
              keyboardType="url"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={focusNote}
              testID="order-dropoff-link"
            />

            <View style={styles.picker}>
              <Text style={styles.pickerLabel}>Zone</Text>
              <AppDropdown
                options={zoneOptions}
                value={values.zoneId}
                placeholder={zonePlaceholder}
                onSelect={changeHandlers.zoneId}
                disabled={zonesLoading}
                accessibilityLabel="Zone"
                testID="order-dropoff-zone"
              />
              {zonesError ? (
                <Text
                  style={zoneErrorStyle}
                  onPress={reloadZones}
                  testID="order-dropoff-zone-error"
                >
                  {zonesError} Tap to retry.
                </Text>
              ) : errors.zoneId ? (
                <Text
                  style={zoneErrorStyle}
                  testID="order-dropoff-zone-message"
                >
                  {errors.zoneId}
                </Text>
              ) : null}
            </View>

            <AppTextField
              ref={noteRef}
              label="Note (optional)"
              value={values.note}
              onChangeText={changeHandlers.note}
              placeholder="Ring the bell twice"
              multiline
              returnKeyType="default"
              testID="order-note"
            />

            <InlineAlert
              message={successMessage}
              tone="success"
              testID="order-success"
            />
          </Animated.View>

          <Animated.View style={actionsStyle}>
            <AppButton
              label="Create order"
              variant="primary"
              fullWidth
              onPress={handleSubmit}
              loading={submitting}
              testID="order-submit"
            />
          </Animated.View>

          {createdOrder ? (
            <View style={styles.tracker}>
              <LiveOrderTracker
                order={tracking.order}
                status={tracking.status}
                card={tracking.card}
                isConnected={tracking.isConnected}
                error={tracking.error}
              />
              {tracking.isTerminal ? (
                <AppButton
                  label="Track another order"
                  variant="outline"
                  fullWidth
                  onPress={handleDismissTracker}
                  testID="order-tracker-dismiss"
                />
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <MotoLoader visible={submitting} label="Creating the order…" />

      <AppDialog
        visible={errorVisible}
        title={errorContent.title}
        message={errorContent.message}
        tone="danger"
        onConfirm={dismissError}
        testID="order-error"
      />
    </View>
  );
};

export const CreateOrderTab = memo(CreateOrderTabComponent);
CreateOrderTab.displayName = 'CreateOrderTab';
