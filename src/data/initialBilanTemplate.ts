import { BilanTemplate } from '../types';

export const INITIAL_BILAN_TEMPLATE: BilanTemplate = {
  id: 'initial-bilan',
  name: 'Bilan Initial (Système)',
  coachId: 'system',
  sections: [
    {
      id: 'civilite',
      title: 'Informations Civiles',
      isRemovable: false,
      isCivility: true,
      fields: [
        { id: 'prenom', label: 'Prénom', type: 'text', placeholder: 'Prénom du prospect/client' },
        { id: 'nom', label: 'Nom', type: 'text', placeholder: 'Nom du prospect/client' },
        { id: 'email', label: 'Email', type: 'text', placeholder: 'Email du prospect/client' },
        { id: 'telephone', label: 'Téléphone', type: 'text', placeholder: 'Numéro de téléphone' },
        { id: 'date_naissance', label: 'Date de Naissance', type: 'date', placeholder: '' },
        { id: 'sexe', label: 'Sexe', type: 'select', options: ['Homme', 'Femme'] },
      ],
    },
    {
      id: 'physique',
      title: 'Informations Physiques et Objectifs',
      isRemovable: false,
      fields: [
        { id: 'taille', label: 'Taille (cm)', type: 'number', placeholder: 'Ex: 180' },
        { id: 'poids', label: 'Poids (kg)', type: 'number', placeholder: 'Ex: 75' },
        {
          id: 'activite_physique',
          label: "Niveau d'Activité Physique",
          type: 'select',
          options: [
            'Sédentaire',
            'Légèrement actif',
            'Modérément actif',
            'Très actif',
            'Extrêmement actif',
          ],
        },
        {
          id: 'objectif_principal',
          label: 'Objectif Principal',
          type: 'textarea',
          placeholder: "Décrivez l'objectif principal du client",
        },
      ],
    },
    {
      id: 'nutrition',
      title: 'Nutrition et Habitudes',
      isRemovable: false,
      fields: [
        {
          id: 'habitudes',
          label: 'Habitudes Alimentaires Générales',
          type: 'textarea',
          placeholder: 'Ex: 3 repas par jour, grignotage occasionnel, etc.',
        },
        {
          id: 'allergies',
          label: 'Allergies Connues',
          type: 'checkbox',
          options: ['Gluten', 'Lactose', 'Fruits à coque', 'Autres'],
          hasOther: true,
          otherFieldId: 'allergies_autre',
        },
        {
          id: 'allergies_autre',
          label: 'Précisez les autres allergies',
          type: 'text',
          placeholder: 'Ex: Arachides',
          conditionalOn: 'allergies',
          conditionalValue: 'Autres',
        },
        {
          id: 'aversions',
          label: 'Aversions Alimentaires',
          type: 'textarea',
          placeholder: "Quels aliments le client n'aime pas ?",
        },
      ],
    },
    {
      id: 'training',
      title: 'Objectif et Conditions d\'Entraînement',
      isRemovable: false,
      fields: [
        {
          id: 'experience_sportive',
          label: 'Expérience sportive',
          type: 'textarea',
          placeholder: 'Décrivez l\'expérience sportive du client',
          required: false,
        },
        {
          id: 'pratique_musculation_depuis',
          label: 'Pratique la musculation depuis',
          type: 'select',
          options: [
            'Pas encore commencé',
            'Moins de 6 mois',
            'Plus d\'1 an',
            'Entre 2 ans et 5 ans',
            'Plus de 5 ans',
          ],
          required: false,
        },
        {
          id: 'seances_par_semaine',
          label: 'Combien de séances/semaine',
          type: 'number',
          placeholder: 'Ex: 4',
          required: false,
        },
        {
          id: 'duree_seances',
          label: 'Durée des séances (minutes)',
          type: 'number',
          placeholder: 'Ex: 90',
          required: false,
        },
        {
          id: 'entrainement_type',
          label: 'Entraînement type',
          type: 'textarea',
          placeholder: 'Décrivez le type d\'entraînement (ex: PPL, Full Body, etc.)',
          required: false,
        },
        {
          id: 'problematique',
          label: 'Problématique rencontrée',
          type: 'textarea',
          placeholder: 'Décrivez les problématiques rencontrées (douleurs, limitations, etc.)',
          required: false,
        },
      ],
    },
    {
      id: 'medical',
      title: 'Antécédents et Notes Coach',
      isRemovable: false,
      fields: [
        {
          id: 'antecedents_medicaux',
          label: 'Antécédents Médicaux Importants',
          type: 'textarea',
          placeholder: 'Blessures, maladies chroniques, médicaments...',
        },
        {
          id: 'notes_coach',
          label: 'Notes Coach (Interne)',
          type: 'textarea',
          placeholder: 'Notes personnelles sur le prospect/client',
        },
      ],
    },
  ],
};
