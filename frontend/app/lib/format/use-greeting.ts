"use client";

import { useEffect, useState } from "react";

const APP_TIME_ZONE = "Africa/Lagos";

function getHourInAppTimeZone(date: Date) {
  const hourPart = new Intl.DateTimeFormat("en-NG", {
    hour: "2-digit",
    hour12: false,
    timeZone: APP_TIME_ZONE,
  })
    .formatToParts(date)
    .find((part) => part.type === "hour");

  return Number(hourPart?.value ?? "0");
}

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function useGreeting() {
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(greetingForHour(getHourInAppTimeZone(new Date())));
    };

    updateGreeting();
    const intervalId = window.setInterval(updateGreeting, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  return greeting;
}
