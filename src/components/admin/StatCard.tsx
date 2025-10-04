import React from 'react';
import Card from '../Card';

interface StatCardProps {
    title: string;
    value: string | number;
    children: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, children }) => (
    <Card className="p-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            {children}
        </div>
        <p className="text-3xl font-bold text-gray-800 mt-4">{value}</p>
        <p className="text-gray-500 mt-1">{title}</p>
    </Card>
);

export default StatCard;
