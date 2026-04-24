import { supabase } from '../supabaseClient';

export const getPlatformSettings = async () => {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000000')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching platform settings:', error);
    return null;
  }
  return data;
};

export const updatePlatformSettings = async (settings) => {
  const { data, error } = await supabase
    .from('platform_settings')
    .update(settings)
    .eq('id', '00000000-0000-0000-0000-000000000000')
    .select()
    .single();

  if (error) {
    console.error('Error updating platform settings:', error);
    throw error;
  }
  return data;
};

export const uploadLogo = async (file) => {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `platform-logo-${Date.now()}.${fileExt}`;
  const filePath = `branding/${fileName}`;

  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(filePath);

  return publicUrl;
};
