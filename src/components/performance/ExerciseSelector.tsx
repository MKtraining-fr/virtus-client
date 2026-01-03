import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Dumbbell } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Exercise } from '../../types';

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void;
  placeholder?: string;
  className?: string;
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  onSelect,
  placeholder = "Rechercher un exercice...",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchExercises = async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('exercises')
          .select('*')
          .ilike('name', `%${searchTerm}%`)
          .limit(10);

        if (error) throw error;
        setResults(data || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Error searching exercises:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchExercises, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-3 w-3 text-gray-400" />
          </button>
        )}
      </div>

      {isOpen && (results.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Chargement...
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {results.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => {
                    onSelect(exercise);
                    setSearchTerm('');
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{exercise.name}</div>
                    {exercise.category && (
                      <div className="text-xs text-gray-500">{exercise.category}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
