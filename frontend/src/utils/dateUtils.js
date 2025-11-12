import dayjs from 'dayjs';

// --- TÁI SỬ DỤNG: Hàm lấy số tuần và ngày ---
export const getWeekNumber = (date) => {
  return dayjs(date).isoWeek();
};

export const getStartAndEndOfWeek = (weekNumber, year = dayjs().year()) => {
  const startDate = dayjs().year(year).isoWeek(weekNumber).startOf('isoWeek');
  const endDate = dayjs().year(year).isoWeek(weekNumber).endOf('isoWeek');
  return {
    start: startDate.format('DD/MM/YYYY'),
    end: endDate.format('DD/MM/YYYY'),
  };
};