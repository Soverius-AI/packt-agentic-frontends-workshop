export interface SeedMetric {
  readonly id: string;
  readonly roomId: string;
  readonly equipmentName: string | null;
  readonly name: string;
  readonly kind: "numeric" | "state";
  readonly unit: string;
  readonly condition: "normal" | "warning" | "critical" | "unavailable";
  readonly trend: string;
  readonly target: string;
  readonly detail: string;
  readonly sortOrder: number;
  readonly reading: (
    index: number,
    total: number,
  ) => { numericValue: number | null; textValue: string | null };
}

export interface SimulatedMetricReading {
  readonly numericValue: number | null;
  readonly textValue: string | null;
  readonly condition: SeedMetric["condition"];
  readonly trend: string;
}

const round = (value: number, precision = 1): number => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const varied = (
  current: number | null,
  fallback: number,
  step: number,
  minimum: number,
  maximum: number,
  random: () => number,
  precision = 1,
): number =>
  round(
    clamp((current ?? fallback) + (random() * 2 - 1) * step, minimum, maximum),
    precision,
  );

const numericResult = (
  value: number,
  normal: boolean,
  critical: boolean,
  previous: number | null,
): SimulatedMetricReading => ({
  numericValue: value,
  textValue: null,
  condition: critical ? "critical" : normal ? "normal" : "warning",
  trend:
    previous === null || Math.abs(value - previous) < 0.05
      ? "Stable"
      : value > previous
        ? "Rising"
        : "Falling",
});

export const generateLiveReading = (
  metricId: string,
  currentNumericValue: number | null,
  currentTextValue: string | null,
  random: () => number,
  coolingAirWarning = true,
): SimulatedMetricReading => {
  switch (metricId) {
    case "cooling-air-temperature": {
      const value = coolingAirWarning
        ? varied(currentNumericValue, 20.5, 0.35, 18.5, 22, random)
        : varied(currentNumericValue, 17.2, 0.2, 16.5, 18, random);
      return numericResult(
        value,
        !coolingAirWarning,
        false,
        currentNumericValue,
      );
    }
    case "cooling-relative-humidity": {
      const nextIsNormal =
        currentNumericValue !== null && currentNumericValue > 55;
      const value = nextIsNormal
        ? round(46 + random() * 8)
        : round(56 + random() * 8);
      return numericResult(value, nextIsNormal, false, currentNumericValue);
    }
    case "cooling-product-surface-temperature": {
      const value = varied(currentNumericValue, 17, 0.25, 16, 19, random);
      return numericResult(value, true, false, currentNumericValue);
    }
    case "cooling-supply-air-temperature": {
      const value = varied(currentNumericValue, 13.6, 0.3, 12, 15, random);
      return numericResult(value, true, false, currentNumericValue);
    }
    case "cooling-unit-power": {
      const value = varied(currentNumericValue, 3.2, 0.1, 2.8, 3.6, random, 2);
      return numericResult(value, true, false, currentNumericValue);
    }
    case "packaging-air-temperature": {
      const value = varied(currentNumericValue, 22.6, 0.3, 21, 24, random);
      return numericResult(value, true, false, currentNumericValue);
    }
    case "packaging-relative-humidity": {
      const value = varied(currentNumericValue, 49, 0.8, 45, 55, random);
      return numericResult(value, true, false, currentNumericValue);
    }
    case "packaging-line-state": {
      const chance = random();
      const value = chance < 0.2 ? "idle" : "running";
      return {
        numericValue: null,
        textValue: value,
        condition: "normal",
        trend: value === currentTextValue ? "Unchanged" : `Changed to ${value}`,
      };
    }
    case "packaging-line-speed": {
      const value = varied(currentNumericValue, 58.5, 1.2, 55, 62, random);
      return numericResult(value, true, false, currentNumericValue);
    }
    case "packaging-seal-temperature": {
      const value = varied(currentNumericValue, 142, 1.1, 138, 146, random);
      return numericResult(value, true, false, currentNumericValue);
    }
    case "packaging-reject-rate": {
      const value = varied(currentNumericValue, 1.1, 0.18, 0.2, 2, random, 2);
      return numericResult(value, true, false, currentNumericValue);
    }
    default:
      throw new Error(
        `No live simulation is configured for metric: ${metricId}`,
      );
  }
};

const factoryDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/Vienna",
});

const factoryDateTimeParts = (
  timestamp: string | number,
): {
  date: string;
  minutes: number;
} => {
  const parts = Object.fromEntries(
    factoryDateTimeFormatter
      .formatToParts(new Date(timestamp))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts["year"]}-${parts["month"]}-${parts["day"]}`,
    minutes: Number(parts["hour"]) * 60 + Number(parts["minute"]),
  };
};

export const isCoolingAirTemperatureWarning = (
  recordedAt: string,
  currentTime = Date.now(),
): boolean => {
  const recorded = factoryDateTimeParts(recordedAt);
  const current = factoryDateTimeParts(currentTime);
  const isCurrentFactoryDay = recorded.date === current.date;
  return (
    recorded.minutes >= 12 * 60 &&
    (isCurrentFactoryDay || recorded.minutes < 14 * 60)
  );
};

export const coolingAirTemperatureAt = (
  recordedAt: string,
  index: number,
  currentTime = Date.now(),
): number => {
  const warning = isCoolingAirTemperatureWarning(recordedAt, currentTime);
  const base = warning ? 20.8 : 17.2;
  return round(stable(base, 0.18, index, 11));
};

const stable = (
  base: number,
  amplitude: number,
  index: number,
  period: number,
): number => base + Math.sin(index / period) * amplitude;

const risingAtEnd = (
  base: number,
  finalValue: number,
  index: number,
  total: number,
): number => {
  const risingPoints = 7;
  const firstRisingIndex = total - risingPoints;
  if (index < firstRisingIndex) {
    return stable(base, 0.18, index, 11);
  }
  const progress = (index - firstRisingIndex + 1) / risingPoints;
  return base + (finalValue - base) * progress;
};

export const ROOMS = [
  {
    id: "cooling-room",
    name: "Cooling room",
    areaType: "Chocolate conditioning and storage",
    description:
      "Racked chocolate batches rest under controlled conditions before entering the packaging hall.",
    sortOrder: 1,
  },
  {
    id: "packaging-hall",
    name: "Packaging hall",
    areaType: "Primary packaging",
    description:
      "Finished chocolate is wrapped, sealed, checked, and prepared for dispatch.",
    sortOrder: 2,
  },
] as const;

export const METRICS: readonly SeedMetric[] = [
  {
    id: "cooling-air-temperature",
    roomId: "cooling-room",
    equipmentName: null,
    name: "Air temperature",
    kind: "numeric",
    unit: "°C",
    condition: "warning",
    trend: "Rising for 30 min",
    target: "16–18 °C",
    detail: "Moving steadily toward the adjacent packaging hall temperature.",
    sortOrder: 1,
    reading: (index, total) => ({
      numericValue: round(risingAtEnd(17.2, 21.4, index, total)),
      textValue: null,
    }),
  },
  {
    id: "cooling-relative-humidity",
    roomId: "cooling-room",
    equipmentName: null,
    name: "Relative humidity",
    kind: "numeric",
    unit: "% RH",
    condition: "warning",
    trend: "Rising for 25 min",
    target: "45–55% RH",
    detail: "Warm hall air may be entering the controlled room.",
    sortOrder: 2,
    reading: (index, total) => ({
      numericValue: round(risingAtEnd(51.5, 61.8, index, total)),
      textValue: null,
    }),
  },
  {
    id: "cooling-product-surface-temperature",
    roomId: "cooling-room",
    equipmentName: "Batch probe P-03",
    name: "Product surface temperature",
    kind: "numeric",
    unit: "°C",
    condition: "normal",
    trend: "Slow rise",
    target: "16–19 °C",
    detail:
      "Sampled from batch CH-240824-B; still within its configured release range.",
    sortOrder: 3,
    reading: (index, total) => ({
      numericValue: round(risingAtEnd(17, 18.4, index, total)),
      textValue: null,
    }),
  },
  {
    id: "cooling-supply-air-temperature",
    roomId: "cooling-room",
    equipmentName: "Cooling unit CU-03",
    name: "Supply-air temperature",
    kind: "numeric",
    unit: "°C",
    condition: "normal",
    trend: "Stable",
    target: "12–15 °C",
    detail: "The cooling unit continues to deliver conditioned air.",
    sortOrder: 4,
    reading: (index) => ({
      numericValue: round(stable(13.6, 0.3, index, 9)),
      textValue: null,
    }),
  },
  {
    id: "cooling-unit-power",
    roomId: "cooling-room",
    equipmentName: "Cooling unit CU-03",
    name: "Cooling-unit power",
    kind: "numeric",
    unit: "kW",
    condition: "normal",
    trend: "Running continuously",
    target: "2.8–3.6 kW",
    detail: "Power consumption indicates that the cooling unit is operating.",
    sortOrder: 5,
    reading: (index) => ({
      numericValue: round(stable(3.2, 0.12, index, 6), 2),
      textValue: null,
    }),
  },
  {
    id: "packaging-air-temperature",
    roomId: "packaging-hall",
    equipmentName: null,
    name: "Air temperature",
    kind: "numeric",
    unit: "°C",
    condition: "normal",
    trend: "Stable",
    target: "21–24 °C",
    detail: "Provides the adjacent-room comparison for Cooling Room 3.",
    sortOrder: 1,
    reading: (index) => ({
      numericValue: round(stable(22.6, 0.25, index, 17)),
      textValue: null,
    }),
  },
  {
    id: "packaging-relative-humidity",
    roomId: "packaging-hall",
    equipmentName: null,
    name: "Relative humidity",
    kind: "numeric",
    unit: "% RH",
    condition: "normal",
    trend: "Stable",
    target: "45–55% RH",
    detail:
      "Environmental condition for wrapping and handling finished chocolate.",
    sortOrder: 2,
    reading: (index) => ({
      numericValue: round(stable(49, 1.2, index, 14)),
      textValue: null,
    }),
  },
  {
    id: "packaging-line-state",
    roomId: "packaging-hall",
    equipmentName: "Packaging line PK-01",
    name: "Line state",
    kind: "state",
    unit: "",
    condition: "normal",
    trend: "Running since 21:00",
    target: "idle / running",
    detail: "The line is processing the current batch normally.",
    sortOrder: 3,
    reading: () => ({ numericValue: null, textValue: "running" }),
  },
  {
    id: "packaging-line-speed",
    roomId: "packaging-hall",
    equipmentName: "Packaging line PK-01",
    name: "Line speed",
    kind: "numeric",
    unit: "packs/min",
    condition: "normal",
    trend: "Stable",
    target: "55–62 packs/min",
    detail: "Throughput is within the configured production range.",
    sortOrder: 4,
    reading: (index) => ({
      numericValue: round(stable(58.5, 1.1, index, 5)),
      textValue: null,
    }),
  },
  {
    id: "packaging-seal-temperature",
    roomId: "packaging-hall",
    equipmentName: "Flow wrapper FW-01",
    name: "Seal temperature",
    kind: "numeric",
    unit: "°C",
    condition: "normal",
    trend: "Stable",
    target: "138–146 °C",
    detail:
      "The wrapper sealing process remains inside its configured recipe band.",
    sortOrder: 5,
    reading: (index) => ({
      numericValue: round(stable(142, 1.4, index, 7)),
      textValue: null,
    }),
  },
  {
    id: "packaging-reject-rate",
    roomId: "packaging-hall",
    equipmentName: "Vision check VC-01",
    name: "Package reject rate",
    kind: "numeric",
    unit: "%",
    condition: "normal",
    trend: "Stable",
    target: "0.2–2%",
    detail:
      "Rejected packages are recorded and removed from dispatch automatically.",
    sortOrder: 6,
    reading: (index) => ({
      numericValue: round(Math.max(0.4, stable(1.1, 0.35, index, 8)), 2),
      textValue: null,
    }),
  },
];
