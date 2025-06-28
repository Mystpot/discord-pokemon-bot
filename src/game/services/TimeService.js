class TimeService {
  static getTimeOfDay() {
    const hour = new Date().getHours();
    return hour > 20 || hour < 6 ? 'night' : 
           hour > 17 ? 'evening' : 'day';
  }

  static getSeason() {
    const month = new Date().getMonth();
    return [
      'winter', 'winter',     // Jan, Feb
      'spring', 'spring', 'spring', // Mar-May
      'summer', 'summer', 'summer', // Jun-Aug
      'autumn', 'autumn',     // Sep, Oct
      'winter'                // Dec
    ][month];
  }

  static isWeekend() {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  }
}

module.exports = TimeService;