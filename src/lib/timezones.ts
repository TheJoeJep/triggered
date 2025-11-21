// This file will be used on the client, so we can use browser APIs.
// If this were needed on the server, we would need a library.
let timezones: string[] = [];

try {
  if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
    timezones = Intl.supportedValuesOf('timeZone');
  } else {
    // Fallback for older environments
    timezones = [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
    ];
  }
} catch (e) {
   // Fallback in case of error
   timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
  ];
}


export const supportedTimezones = timezones;
