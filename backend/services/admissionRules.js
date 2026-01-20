/**
 * Rule-based admission allocation engine.
 * Matches an admission request to an available HospitalBed type.
 */

/**
 * Decide bed type preference order based on severity and constraints.
 */
function getPreferredBedTypes({ bedType, severity, oxygenRequired, isolationRequired }) {
  // If explicit bedType requested, respect it first
  const requested = bedType ? [bedType] : [];

  // Critical patients: prefer ICU, then Emergency, then General
  if (severity === 'critical') {
    return [...requested, 'ICU', 'Emergency', 'General', 'Private'].filter(unique);
  }

  // High severity: prefer Emergency if acute, else ICU/General depending on oxygen requirement
  if (severity === 'high') {
    if (oxygenRequired) return [...requested, 'ICU', 'Emergency', 'General', 'Private'].filter(unique);
    return [...requested, 'Emergency', 'General', 'ICU', 'Private'].filter(unique);
  }

  // Medium: default General; isolation might prefer Private if available
  if (severity === 'medium') {
    if (isolationRequired) return [...requested, 'Private', 'General', 'Emergency', 'ICU'].filter(unique);
    return [...requested, 'General', 'Private', 'Emergency', 'ICU'].filter(unique);
  }

  // Low: prefer General, then Private
  if (isolationRequired) return [...requested, 'Private', 'General', 'Emergency', 'ICU'].filter(unique);
  return [...requested, 'General', 'Private', 'Emergency', 'ICU'].filter(unique);
}

function unique(v, i, arr) {
  return arr.indexOf(v) === i;
}

/**
 * Allocate a bed record from an array of HospitalBed docs.
 * Returns { allocatedBed, allocationNote } or null if no match.
 */
function allocateBed(admission, beds) {
  const preferred = getPreferredBedTypes(admission);
  for (const type of preferred) {
    const bed = beds.find((b) => b.type === type && b.available > 0);
    if (bed) {
      return {
        allocatedBed: bed,
        allocationNote: `Allocated ${type} based on rules (severity=${admission.severity}, oxygen=${!!admission.oxygenRequired}, isolation=${!!admission.isolationRequired}).`
      };
    }
  }
  return null;
}

module.exports = { allocateBed, getPreferredBedTypes };

