import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { retryOnNetworkError } from './retry';
import { logError, logInfo } from './logger';

/**
 * Récupère un document Firestore avec retry automatique
 * 
 * @param collectionName - Nom de la collection
 * @param documentId - ID du document
 * @returns Les données du document ou null si non trouvé
 */
export async function getDocumentWithRetry<T = DocumentData>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, documentId) as DocumentReference<T>;
    
    const docSnap = await retryOnNetworkError(
      () => getDoc(docRef),
      { maxAttempts: 3, delayMs: 1000 }
    );

    if (docSnap.exists()) {
      logInfo(`Document récupéré: ${collectionName}/${documentId}`);
      return docSnap.data();
    }

    return null;
  } catch (error) {
    logError(
      `Erreur lors de la récupération du document ${collectionName}/${documentId}`,
      error as Error
    );
    throw error;
  }
}

/**
 * Récupère une collection Firestore avec retry automatique
 * 
 * @param collectionName - Nom de la collection
 * @param constraints - Contraintes de requête optionnelles (where, orderBy, limit, etc.)
 * @returns Liste des documents
 */
export async function getCollectionWithRetry<T = DocumentData>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName) as CollectionReference<T>;
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;

    const querySnapshot = await retryOnNetworkError(
      () => getDocs(q),
      { maxAttempts: 3, delayMs: 1000 }
    );

    const documents = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];

    logInfo(`Collection récupérée: ${collectionName} (${documents.length} documents)`);
    return documents;
  } catch (error) {
    logError(
      `Erreur lors de la récupération de la collection ${collectionName}`,
      error as Error
    );
    throw error;
  }
}

/**
 * Crée ou met à jour un document Firestore avec retry automatique
 * 
 * @param collectionName - Nom de la collection
 * @param documentId - ID du document
 * @param data - Données à enregistrer
 */
export async function setDocumentWithRetry<T = DocumentData>(
  collectionName: string,
  documentId: string,
  data: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);

    await retryOnNetworkError(
      () => setDoc(docRef, data as DocumentData),
      { maxAttempts: 3, delayMs: 1000 }
    );

    logInfo(`Document enregistré: ${collectionName}/${documentId}`);
  } catch (error) {
    logError(
      `Erreur lors de l'enregistrement du document ${collectionName}/${documentId}`,
      error as Error
    );
    throw error;
  }
}

/**
 * Met à jour partiellement un document Firestore avec retry automatique
 * 
 * @param collectionName - Nom de la collection
 * @param documentId - ID du document
 * @param data - Données à mettre à jour
 */
export async function updateDocumentWithRetry<T = Partial<DocumentData>>(
  collectionName: string,
  documentId: string,
  data: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);

    await retryOnNetworkError(
      () => updateDoc(docRef, data as DocumentData),
      { maxAttempts: 3, delayMs: 1000 }
    );

    logInfo(`Document mis à jour: ${collectionName}/${documentId}`);
  } catch (error) {
    logError(
      `Erreur lors de la mise à jour du document ${collectionName}/${documentId}`,
      error as Error
    );
    throw error;
  }
}

/**
 * Supprime un document Firestore avec retry automatique
 * 
 * @param collectionName - Nom de la collection
 * @param documentId - ID du document
 */
export async function deleteDocumentWithRetry(
  collectionName: string,
  documentId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);

    await retryOnNetworkError(
      () => deleteDoc(docRef),
      { maxAttempts: 3, delayMs: 1000 }
    );

    logInfo(`Document supprimé: ${collectionName}/${documentId}`);
  } catch (error) {
    logError(
      `Erreur lors de la suppression du document ${collectionName}/${documentId}`,
      error as Error
    );
    throw error;
  }
}

/**
 * Helpers pour créer des contraintes de requête de manière typée
 */
export const FirestoreQuery = {
  where: where,
  orderBy: orderBy,
  limit: limit,
};
