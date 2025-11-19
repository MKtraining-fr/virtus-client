import React, { useState, useEffect } from 'react';
import { Upload, Save, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface PWAConfig {
  icon_192: string;
  icon_512: string;
  name: string;
  short_name: string;
  theme_color: string;
  background_color: string;
}

export default function PWASettings() {
  const [config, setConfig] = useState<PWAConfig>({
    icon_192: '',
    icon_512: '',
    name: 'Virtus',
    short_name: 'Virtus',
    theme_color: '#7A68FA',
    background_color: '#121212',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading192, setUploading192] = useState(false);
  const [uploading512, setUploading512] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'pwa_config')
        .single();

      if (error) throw error;

      if (data?.value) {
        setConfig(data.value as PWAConfig);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement de la configuration' });
    } finally {
      setLoading(false);
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'virtus_pwa_icons'); // À configurer dans Cloudinary
    formData.append('folder', 'pwa-icons');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors de l\'upload vers Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleIconUpload = async (file: File, size: '192' | '512') => {
    try {
      // Vérifier la taille de l'image
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          const expectedSize = parseInt(size);
          if (img.width !== expectedSize || img.height !== expectedSize) {
            reject(new Error(`L'image doit faire exactement ${size}x${size}px`));
          }
          resolve(true);
        };
        img.onerror = () => reject(new Error('Impossible de charger l\'image'));
        img.src = objectUrl;
      });

      URL.revokeObjectURL(objectUrl);

      // Upload vers Cloudinary
      if (size === '192') setUploading192(true);
      else setUploading512(true);

      const url = await uploadToCloudinary(file);

      setConfig(prev => ({
        ...prev,
        [`icon_${size}`]: url,
      }));

      setMessage({ type: 'success', text: `Icône ${size}x${size} uploadée avec succès` });
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erreur lors de l\'upload' 
      });
    } finally {
      if (size === '192') setUploading192(false);
      else setUploading512(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, size: '192' | '512') => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Veuillez sélectionner une image' });
        return;
      }
      handleIconUpload(file, size);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Vérifier que les icônes sont définies
      if (!config.icon_192 || !config.icon_512) {
        setMessage({ type: 'error', text: 'Les deux icônes sont obligatoires' });
        return;
      }

      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'pwa_config',
          value: config,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Configuration PWA sauvegardée avec succès' });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde de la configuration' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Configuration PWA
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Personnalisez l'icône et les paramètres de l'application PWA pour tous les clients
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 space-y-6">
        {/* Icônes */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Icônes de l'application
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Icône 192x192 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Icône 192x192px
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                {config.icon_192 ? (
                  <div className="space-y-3">
                    <img 
                      src={config.icon_192} 
                      alt="Icône 192x192" 
                      className="w-32 h-32 mx-auto object-contain"
                    />
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, '192')}
                        className="hidden"
                        disabled={uploading192}
                      />
                      <button
                        type="button"
                        onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                        disabled={uploading192}
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        {uploading192 ? 'Upload en cours...' : 'Changer l\'icône'}
                      </button>
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, '192')}
                      className="hidden"
                      disabled={uploading192}
                    />
                    <div className="text-center py-8">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {uploading192 ? 'Upload en cours...' : 'Cliquez pour uploader'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        PNG recommandé, 192x192px
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Icône 512x512 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Icône 512x512px
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                {config.icon_512 ? (
                  <div className="space-y-3">
                    <img 
                      src={config.icon_512} 
                      alt="Icône 512x512" 
                      className="w-32 h-32 mx-auto object-contain"
                    />
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, '512')}
                        className="hidden"
                        disabled={uploading512}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.currentTarget.parentElement?.querySelector<HTMLInputElement>('input[type="file"]');
                          input?.click();
                        }}
                        disabled={uploading512}
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        {uploading512 ? 'Upload en cours...' : 'Changer l\'icône'}
                      </button>
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, '512')}
                      className="hidden"
                      disabled={uploading512}
                    />
                    <div className="text-center py-8">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {uploading512 ? 'Upload en cours...' : 'Cliquez pour uploader'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        PNG recommandé, 512x512px
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Informations de l'application */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Informations de l'application
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom court
              </label>
              <input
                type="text"
                value={config.short_name}
                onChange={(e) => setConfig(prev => ({ ...prev, short_name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Couleur de thème
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.theme_color}
                  onChange={(e) => setConfig(prev => ({ ...prev, theme_color: e.target.value }))}
                  className="h-10 w-20 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={config.theme_color}
                  onChange={(e) => setConfig(prev => ({ ...prev, theme_color: e.target.value }))}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Couleur de fond
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.background_color}
                  onChange={(e) => setConfig(prev => ({ ...prev, background_color: e.target.value }))}
                  className="h-10 w-20 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={config.background_color}
                  onChange={(e) => setConfig(prev => ({ ...prev, background_color: e.target.value }))}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={saving || !config.icon_192 || !config.icon_512}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {saving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
          </button>
        </div>
      </div>

      {/* Note importante */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex gap-2">
          <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Note importante :</p>
            <p>
              Les utilisateurs qui ont déjà installé l'application PWA devront la désinstaller et la réinstaller 
              pour voir les nouvelles icônes. Les nouveaux utilisateurs verront automatiquement les icônes mises à jour.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
