import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

/**
 * Hook pour générer une URL signée à partir d'un chemin de fichier Storage
 * @param filePath Chemin du fichier dans le bucket (ex: "client-id/filename.jpg")
 * @param bucketName Nom du bucket Storage
 * @param expiresIn Durée de validité en secondes (défaut: 1 heure)
 */
export function useSignedUrl(
  filePath: string | null,
  bucketName: string = 'client-documents',
  expiresIn: number = 3600
) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!filePath) {
      setSignedUrl(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function generateSignedUrl() {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: signError } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filePath, expiresIn);

        if (signError) {
          throw signError;
        }

        if (isMounted && data?.signedUrl) {
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Erreur génération URL signée:', err);
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    generateSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [filePath, bucketName, expiresIn]);

  return { signedUrl, isLoading, error };
}
