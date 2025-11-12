import { useState, useEffect, useMemo } from 'react';
import { fetchData } from '../utils/api.js';

export const useRules = (token) => {
    const [allRules, setAllRules] = useState([]);
    const [rulesError, setRulesError] = useState(null);
    const [isLoadingRules, setIsLoadingRules] = useState(true);

    useEffect(() => {
        if (!token) return;

        const loadRules = async () => {
            try {
                const data = await fetchData('/api/rules', 'GET', null, token);
                setAllRules(data.rules || []);
            } catch (err) {
                setRulesError(err.message);
            } finally {
                setIsLoadingRules(false);
            }
        };
        loadRules();
    }, [token]);

    // Trả về các quy tắc đã được lọc sẵn
    const categorizedRules = useMemo(() => {
        return {
            inClassRules: allRules.filter(r => r.is_in_class_violation === 0), // Lỗi trong giờ (SĐB)
            outOfClassRules: allRules.filter(r => r.is_in_class_violation === 1), // Lỗi ngoài giờ (Cờ đỏ)
            bonusRules: allRules.filter(r => r.is_in_class_violation === 2), // Thưởng
        };
    }, [allRules]);

    return { allRules, ...categorizedRules, rulesError, isLoadingRules };
};