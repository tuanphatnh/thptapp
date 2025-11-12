import { useState, useEffect, useCallback } from 'react';
import { fetchData } from '../utils/api.js';

export const useClasses = (token) => {
    const [classes, setClasses] = useState([]);
    const [classesError, setClassesError] = useState(null);
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);

    const loadClasses = useCallback(async () => {
        if (!token) return;
        setIsLoadingClasses(true);
        try {
            const data = await fetchData('/api/classes', 'GET', null, token);
            setClasses(data.classes || []);
        } catch (err) {
            setClassesError(err.message);
        } finally {
            setIsLoadingClasses(false);
        }
    }, [token]);

    useEffect(() => {
        loadClasses();
    }, [loadClasses]);

    return { classes, classesError, isLoadingClasses, refreshClasses: loadClasses };
};