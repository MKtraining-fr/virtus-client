import React from 'react';
import { Link } from 'react-router-dom';

const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
);

const NutritionCard: React.FC<{ title: string; to: string; description: string }> = ({ title, to, description }) => (
    <Link to={to} className="bg-white dark:bg-client-card rounded-lg p-4 flex justify-between items-center w-full hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors group">
        <div>
            <p className="font-bold text-gray-800 dark:text-client-light text-lg">{title}</p>
            <p className="text-sm text-gray-500 dark:text-client-subtle">{description}</p>
        </div>
        <ChevronRightIcon className="w-6 h-6 text-gray-400 dark:text-client-subtle transition-transform group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
);


const ClientNutrition: React.FC = () => {
    return (
        <div className="space-y-4">
            <NutritionCard 
                to="/app/nutrition/journal"
                title="Journal"
                description="Suivez vos repas et calories au quotidien"
            />
            <NutritionCard 
                to="/app/nutrition/menus"
                title="Menus & Plans"
                description="Consultez les plans assignés par votre coach"
            />
            <NutritionCard 
                to="/app/nutrition/recettes"
                title="Recettes"
                description="Découvrez des idées de repas sains"
            />
            <NutritionCard 
                to="/app/nutrition/aliments"
                title="Aliments"
                description="Explorez la base de données Ciqual"
            />
        </div>
    );
};

export default ClientNutrition;