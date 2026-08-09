import { Linking } from 'react-native';

export const openWhatsApp = async (
  phone: string | undefined,
): Promise<void> => {
  const number = phone?.replace(/\D/g, '');
  if (!number) {
    return;
  }
  const appUrl = `whatsapp://send?phone=${number}`;
  const webUrl = `https://wa.me/${number}`;
  try {
    const canOpenApp = await Linking.canOpenURL(appUrl);
    await Linking.openURL(canOpenApp ? appUrl : webUrl);
  } catch {
    // No WhatsApp and no browser — there is nothing left to fall back to.
  }
};
