import { env } from './env'; 

export const uploadToCloudinary = async (imageUri, folder = 'profile_photos') => {
  try {
    const cloudName = env.CLOUDINARY_CLOUD_NAME; 
    const uploadPreset = env.CLOUDINARY_UPLOAD_PRESET; 

    console.log('🔍 Cloudinary Upload Debug:');
    console.log('  Cloud Name:', cloudName);
    console.log('  Upload Preset:', uploadPreset);
    console.log('  Image URI:', imageUri?.substring(0, 50) + '...');

    if (!imageUri) return null;
    if (!cloudName || !uploadPreset) {
      console.error('❌ Missing cloudinary credentials!');
      return null;
    }

    // Create form data
    const formData = new FormData();
    
    // Extract filename and type
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    console.log('  Filename:', filename, 'Type:', type);
    
    // 1. Append File 
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: type,
    });
    
    // 2. Append Cloudinary required fields (UNSIGNED UPLOAD)
    formData.append('upload_preset', uploadPreset); 
    formData.append('folder', folder);
    
    // 3. Upload
    const apiUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    console.log('📍 Uploading to:', apiUrl);

    const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
    });
    
    console.log('📊 Response Status:', response.status);
    const data = await response.json();
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));
    
    if (data.secure_url) {
      console.log('✅ SUCCESS! URL:', data.secure_url);
      return data.secure_url;
    } else if (data.error) {
      console.error('❌ Cloudinary Error:', data.error.message);
      return null;
    } else {
      console.error('❌ Unexpected response:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Network/Parse error:', error);
    return null;
  }
};