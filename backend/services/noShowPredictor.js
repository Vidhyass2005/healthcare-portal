/**
 * No-Show Risk Predictor & Detection Logic
 * Uses heuristic weights based on:
 * - Patient past cancellation / no-show history
 * - Days booked in advance (appointments > 7 days out have higher no-show probability)
 * - Severity level (mild symptoms have higher drop-off)
 */

const calculateNoShowRisk = ({ pastNoShows = 0, totalPastBookings = 0, severity = 'Mild', daysInAdvance = 1 }) => {
  let riskScore = 0.1; // Baseline 10%

  if (totalPastBookings > 0) {
    const historicalRate = pastNoShows / totalPastBookings;
    riskScore += historicalRate * 0.4;
  }

  // Days in advance penalty
  if (daysInAdvance > 7) {
    riskScore += 0.2;
  } else if (daysInAdvance > 3) {
    riskScore += 0.1;
  }

  // Severity buffer
  if (severity.toLowerCase() === 'severe') {
    riskScore -= 0.15;
  } else if (severity.toLowerCase() === 'mild') {
    riskScore += 0.05;
  }

  // Clamp between 0.05 (5%) and 0.95 (95%)
  return Math.min(0.95, Math.max(0.05, Number(riskScore.toFixed(2))));
};

module.exports = {
  calculateNoShowRisk
};
