import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// Ensure API_KEY is set in the environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.warn("API_KEY environment variable not set. Gemini API calls will be mocked.");
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Mock function for when API key is not available
const mockApiCall = <T,>(data: T): Promise<T> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(data);
        }, 1000);
    });
};

/**
 * Generates a workout plan description using the Gemini API.
 * @param programName The name of the workout program.
 * @returns A string containing the workout description.
 */
export const generateWorkoutPlan = async (programName: string): Promise<string> => {
    const prompt = `Crée une description courte et motivante pour un programme d'entraînement de fitness nommé "${programName}". La description doit être en français.`;

    if (!ai) {
        return mockApiCall(`Ceci est une description générée pour le programme "${programName}". Il est conçu pour vous aider à atteindre vos objectifs de fitness grâce à des séances d'entraînement structurées et efficaces. Préparez-vous à vous dépasser !`);
    }

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
                maxOutputTokens: 200,
                thinkingConfig: { thinkingBudget: 100 },
            }
        });
        return response.text;
    } catch (error) {
        console.error('Error generating workout plan with Gemini:', error);
        throw new Error('Failed to generate workout plan.');
    }
};

/**
 * Generates a meal plan using the Gemini API and returns a structured object.
 * @param planName The name or goal of the meal plan.
 * @returns An object containing meal details.
 */
export const generateMealPlan = async (planName: string): Promise<Record<string, string>> => {
    const prompt = `Crée un plan alimentaire d'une journée pour un objectif de "${planName}". Sois concis et direct. Réponds en français.`;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            "petit_dejeuner": { type: Type.STRING, description: "Contenu du petit-déjeuner." },
            "collation_du_matin": { type: Type.STRING, description: "Contenu de la collation du matin." },
            "dejeuner": { type: Type.STRING, description: "Contenu du déjeuner." },
            "collation_de_l_apres_midi": { type: Type.STRING, description: "Contenu de la collation de l'après-midi." },
            "diner": { type: Type.STRING, description: "Contenu du dîner." },
        },
        required: ["petit_dejeuner", "dejeuner", "diner"]
    };

    if (!ai) {
        const mockResponse = {
            "petit_dejeuner": "Flocons d'avoine avec des fruits rouges et une poignée d'amandes.",
            "collation_du_matin": "Yaourt grec 0% avec une cuillère de miel.",
            "dejeuner": "Poitrine de poulet grillée (150g), quinoa (200g cuit) et légumes verts à la vapeur.",
            "collation_de_l_apres_midi": "Une pomme avec une cuillère de beurre de cacahuètes.",
            "diner": "Filet de saumon au four (150g) avec des patates douces rôties et des brocolis."
        };
        return mockApiCall(mockResponse);
    }

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.8,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error('Error generating meal plan with Gemini:', error);
        throw new Error('Failed to generate meal plan.');
    }
};