import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ClientNutrition from './ClientNutrition';
import Journal from './nutrition/Journal';
import Menus from './nutrition/Menus';
import Recipes from './nutrition/Recipes';
import Ciqual from './nutrition/Ciqual';

const NutritionRouter: React.FC = () => (
    <Routes>
        <Route path="/" element={<ClientNutrition />} />
        <Route path="journal" element={<Journal />} />
        <Route path="menus" element={<Menus />} />
        <Route path="recettes" element={<Recipes />} />
        <Route path="aliments" element={<Ciqual />} />
        <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
);

export default NutritionRouter;