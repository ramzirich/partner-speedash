import React from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { useAppSelector } from '../../store';
import { styles } from './ProfileTab.styles';

interface ProfileTabProps {
  onLogout: () => void;
  loggingOut: boolean;
}

const cap = (value?: string): string =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : '';

/**
 * Read-only account screen: shows who's signed in and lets them log out.
 * No edit fields yet — there's no update-profile endpoint to back them.
 */
const ProfileTabComponent: React.FC<ProfileTabProps> = ({
  onLogout,
  loggingOut,
}) => {
  const user = useAppSelector(state => state.auth.user);

  const fullName =
    [cap(user?.firstName), cap(user?.lastName)].filter(Boolean).join(' ') ||
    'Driver';
  const initial = (
    user?.firstName?.charAt(0) ??
    user?.email?.charAt(0) ??
    '?'
  ).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {fullName}
        </Text>
        {user?.email ? (
          <Text style={styles.email} numberOfLines={1}>
            {user.email}
          </Text>
        ) : null}
        {user?.role ? (
          <View style={styles.roleChip}>
            <Text style={styles.roleText}>{cap(user.role)}</Text>
          </View>
        ) : null}
      </View>

      <AppButton
        label="Log out"
        variant="danger"
        fullWidth
        loading={loggingOut}
        onPress={onLogout}
        testID="profile-logout"
      />
    </View>
  );
};

export const ProfileTab = React.memo(ProfileTabComponent);
ProfileTab.displayName = 'ProfileTab';
