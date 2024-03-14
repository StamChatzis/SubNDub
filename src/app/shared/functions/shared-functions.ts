import { TimeFormat } from "src/app/models/general/time-format.model";

export function parseTimestamp(value: string): TimeFormat {
    const parts = value?.split(':');
    const [seconds, milliseconds] = parts[1]?.split('.');
    
    const timeformatObject: TimeFormat = {
      hour: Math.floor(parseInt(parts[0], 10) / 60),
      minute: parseInt(parts[0], 10),
      seconds: parseInt(seconds, 10),
      ms: parseInt(milliseconds, 10)
    };
    
    return timeformatObject;
  }
  
  export function calculateSeconds(timeFormat: TimeFormat): number {
    return (timeFormat.hour * 60 * 60) + (timeFormat.minute * 60) + timeFormat.seconds + (timeFormat.ms/1000);
  }