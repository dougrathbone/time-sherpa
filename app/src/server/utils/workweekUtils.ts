import { WorkweekSettings } from '../../shared/types';

export const defaultWorkweek: WorkweekSettings = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false
};

export function isWorkday(date: Date, workweek: WorkweekSettings = defaultWorkweek): boolean {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  const dayMap: { [key: number]: keyof WorkweekSettings } = {
    0: 'sunday',
    1: 'monday', 
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
  };
  
  const dayName = dayMap[dayOfWeek];
  return workweek[dayName];
}

export function getNextWorkdays(startDate: Date, count: number, workweek: WorkweekSettings = defaultWorkweek): Date[] {
  const workdays: Date[] = [];
  const currentDate = new Date(startDate);
  
  // Look ahead up to 14 days to find workdays
  let daysChecked = 0;
  const maxDaysToCheck = 14;
  
  while (workdays.length < count && daysChecked < maxDaysToCheck) {
    currentDate.setDate(startDate.getDate() + daysChecked);
    
    if (isWorkday(currentDate, workweek)) {
      workdays.push(new Date(currentDate));
    }
    
    daysChecked++;
  }
  
  return workdays;
}

export function getWorkdaysInRange(startDate: Date, endDate: Date, workweek: WorkweekSettings = defaultWorkweek): Date[] {
  const workdays: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (isWorkday(currentDate, workweek)) {
      workdays.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workdays;
}