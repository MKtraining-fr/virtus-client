import React, { useState } from 'react';
import Card from '../../components/Card.tsx';
import Button from '../../components/Button.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Client, Exercise, FoodItem, Product, Partner, IntensificationTechnique } from '../../types.ts';

type ImportableKey = 'users' | 'exercises' | 'ciqual' | 'products' | 'partners' | 'intensification';

const IMPORT_CONFIG: { [key in ImportableKey]: { title: string; requiredHeaders: string[] } } = {
    users: { title: 'Utilisateurs (Coachs & Clients)', requiredHeaders: ['firstName', 'lastName', 'email', 'password', 'role'] },
    exercises: { title: 'Exercices (Musculation, Mobilité, Échauffement)', requiredHeaders: ['name', 'category'] },
    ciqual: { title: 'Base Alimentaire (Ciqual)', requiredHeaders: ['name', 'category', 'calories', 'protein', 'carbs', 'fat'] },
    products: { title: 'Produits Boutique', requiredHeaders: ['name', 'description', 'price', 'category', 'imageUrl', 'productUrl', 'ownerId'] },
    partners: { title: 'Partenaires Boutique', requiredHeaders: ['name', 'description', 'logoUrl', 'offerUrl', 'ownerId'] },
    intensification: { title: 'Techniques d\'Intensification', requiredHeaders: ['name', 'description'] },
};

const DataImport: React.FC = () => {
    const { 
        clients, setClients, 
        exercises, setExercises,
        foodItems, setFoodItems,
        products, setProducts,
        partners, setPartners,
        intensificationTechniques, setIntensificationTechniques,
    } = useAuth();
    
    const [files, setFiles] = useState<Record<string, File | null>>({});
    const [messages, setMessages] = useState<Record<string, { type: 'success' | 'error', text: string }>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    const handleFileChange = (key: ImportableKey, file: File | null) => {
        setFiles(prev => ({ ...prev, [key]: file }));
        setMessages(prev => ({ ...prev, [key]: { type: 'success', text: '' } }));
    };

    const parseCSV = (content: string): { header: string[], rows: string[][] } => {
        const lines = content.replace(/\r\n/g, '\n').split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) throw new Error("Le fichier CSV est vide.");

        const header = lines[0].split(',').map(h => h.trim());
        const rows = lines.slice(1).map(line => line.split(',').map(field => field.trim()));
        return { header, rows };
    };

    const handleImport = async (key: ImportableKey) => {
        const file = files[key];
        if (!file) {
            setMessages(prev => ({ ...prev, [key]: { type: 'error', text: 'Veuillez sélectionner un fichier.' } }));
            return;
        }

        setLoading(prev => ({ ...prev, [key]: true }));

        try {
            const content = await file.text();
            const { header, rows } = parseCSV(content);
            const { requiredHeaders } = IMPORT_CONFIG[key];

            // Validate headers
            const missingHeaders = requiredHeaders.filter(rh => !header.includes(rh));
            if (missingHeaders.length > 0) {
                throw new Error(`En-têtes manquants : ${missingHeaders.join(', ')}`);
            }

            let count = 0;
            switch (key) {
                case 'users': {
                    const newUsers: Client[] = [];
                    rows.forEach((row, i) => {
                        const userObj = header.reduce((obj, h, idx) => ({ ...obj, [h]: row[idx] }), {} as any);
                        const emailExists = clients.some(c => c.email.toLowerCase() === userObj.email.toLowerCase());
                        if (emailExists) return;

                        newUsers.push({
                            id: `user-${Date.now()}-${i}`,
                            status: userObj.status || 'prospect',
                            firstName: userObj.firstName,
                            lastName: userObj.lastName,
                            email: userObj.email,
                            password: userObj.password,
                            phone: userObj.phone || '',
                            age: userObj.dob ? Math.floor((new Date().getTime() - new Date(userObj.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 0,
                            sex: userObj.sex || 'Autre',
                            registrationDate: new Date().toISOString().split('T')[0],
                            role: userObj.role,
                            coachId: userObj.coachId,
                            affiliationCode: userObj.affiliationCode,
                            objective: userObj.objective || '',
                            notes: '',
                            medicalInfo: { history: '', allergies: '' },
                            nutrition: { measurements: {}, weightHistory: [], calorieHistory: [], macros: { protein: 0, carbs: 0, fat: 0 }, historyLog: [], foodJournal: {} },
                        } as Client);
                        count++;
                    });
                    setClients([...clients, ...newUsers]);
                    break;
                }
                case 'exercises': {
                    const newExercises: Exercise[] = rows.map((row, i) => {
                        const exObj = header.reduce((obj, h, i) => ({ ...obj, [h]: row[i] }), {} as any);
                        count++;
                        return {
                            id: `ex-${Date.now()}-${i}`,
                            name: exObj.name,
                            category: exObj.category,
                            description: exObj.description || '',
                            videoUrl: exObj.videoUrl || '',
                            illustrationUrl: exObj.illustrationUrl || '',
                            equipment: exObj.equipment,
                            muscleGroups: exObj.muscleGroups ? exObj.muscleGroups.split('|') : [],
                            coachId: 'system',
                        };
                    });
                    setExercises([...exercises, ...newExercises]);
                    break;
                }
                case 'ciqual': {
                     const newFoodItems: FoodItem[] = rows.map((row) => {
                        const foodObj = header.reduce((obj, h, i) => ({ ...obj, [h]: row[i] }), {} as any);
                        const nameExists = foodItems.some(f => f.name.toLowerCase() === foodObj.name.toLowerCase());
                        if(nameExists) return null;
                        count++;
                        return {
                            name: foodObj.name,
                            category: foodObj.category,
                            calories: parseFloat(foodObj.calories) || 0,
                            protein: parseFloat(foodObj.protein) || 0,
                            carbs: parseFloat(foodObj.carbs) || 0,
                            fat: parseFloat(foodObj.fat) || 0,
                        };
                    }).filter((item): item is FoodItem => item !== null);
                    setFoodItems([...foodItems, ...newFoodItems]);
                    break;
                }
                case 'products': {
                    const newProducts: Product[] = rows.map((row, i) => {
                        const prodObj = header.reduce((obj, h, i) => ({ ...obj, [h]: row[i] }), {} as any);
                        count++;
                        return {
                            id: `prod-${Date.now()}-${i}`,
                            ownerId: prodObj.ownerId,
                            name: prodObj.name,
                            description: prodObj.description,
                            imageUrl: prodObj.imageUrl,
                            productUrl: prodObj.productUrl,
                            price: parseFloat(prodObj.price) || 0,
                            category: prodObj.category,
                        }
                    });
                    setProducts([...products, ...newProducts]);
                    break;
                }
                case 'partners': {
                    const newPartners: Partner[] = rows.map((row, i) => {
                        const partObj = header.reduce((obj, h, i) => ({ ...obj, [h]: row[i] }), {} as any);
                        count++;
                        return {
                            id: `part-${Date.now()}-${i}`,
                            ownerId: partObj.ownerId,
                            name: partObj.name,
                            logoUrl: partObj.logoUrl,
                            description: partObj.description,
                            offerUrl: partObj.offerUrl,
                        }
                    });
                    setPartners([...partners, ...newPartners]);
                    break;
                }
                 case 'intensification': {
                    const newTechniques: IntensificationTechnique[] = rows.map((row, i) => {
                        const techObj = header.reduce((obj, h, i) => ({ ...obj, [h]: row[i] }), {} as any);
                        const nameExists = intensificationTechniques.some(t => t.name.toLowerCase() === techObj.name.toLowerCase());
                        if(nameExists) return null;
                        count++;
                        return {
                            id: `intens-${Date.now()}-${i}`,
                            name: techObj.name,
                            description: techObj.description,
                        };
                    }).filter((item): item is IntensificationTechnique => item !== null);
                    setIntensificationTechniques([...intensificationTechniques, ...newTechniques]);
                    break;
                }
            }
            setMessages(prev => ({ ...prev, [key]: { type: 'success', text: `${count} ligne(s) importée(s) avec succès.` } }));

        } catch (error: any) {
            setMessages(prev => ({ ...prev, [key]: { type: 'error', text: `Erreur : ${error.message}` } }));
        } finally {
            setLoading(prev => ({ ...prev, [key]: false }));
            setFiles(prev => ({ ...prev, [key]: null }));
        }
    };
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Import de données CSV</h1>
            <p className="mb-8 text-gray-600">Utilisez cette page pour importer en masse des données dans l'application. Assurez-vous que vos fichiers CSV respectent le format et les en-têtes de colonnes requis.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(Object.keys(IMPORT_CONFIG) as ImportableKey[]).map(key => (
                    <Card key={key} className="p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-3">{IMPORT_CONFIG[key].title}</h2>
                        <div className="space-y-3">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={(e) => handleFileChange(key, e.target.files ? e.target.files[0] : null)}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-primary hover:file:bg-violet-100"
                            />
                            <Button
                                onClick={() => handleImport(key)}
                                disabled={!files[key] || loading[key]}
                                className="w-full"
                            >
                                {loading[key] ? 'Importation...' : 'Importer'}
                            </Button>
                            {messages[key]?.text && (
                                <p className={`text-sm text-center font-medium ${messages[key].type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                                    {messages[key].text}
                                </p>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default DataImport;