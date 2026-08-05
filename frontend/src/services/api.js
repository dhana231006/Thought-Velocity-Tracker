const API_BASE_URL = 'http://localhost:8000/api';

export const fetchStudentProfile = async (studentId) => {
  try {
    // Simulated fetch for now, to ensure frontend works without backend running
    // const response = await fetch(`${API_BASE_URL}/students/${studentId}/profile`);
    // return await response.json();
    return {
      studentId,
      velocity: 12.4,
      cognitiveDepth: 84,
      trajectory: 'Accelerating',
      history: [
        { session: 9, date: '2026-08-10', velocity: 1.8, depth: 75, dimensions: [60, 50, 70, 40, 80, 55] },
        { session: 10, date: '2026-09-10', velocity: 2.1, depth: 79, dimensions: [65, 55, 75, 45, 82, 60] },
        { session: 11, date: '2026-10-10', velocity: 2.5, depth: 84, dimensions: [75, 65, 80, 60, 85, 70] },
      ],
      currentDimensions: [75, 65, 80, 60, 85, 70],
      previousDimensions: [65, 55, 75, 45, 82, 60]
    };
  } catch (error) {
    console.error('Error fetching student profile:', error);
    throw error;
  }
};

export const fetchFacultyAlerts = async () => {
  try {
    // Simulated fetch
    return [
      { studentId: 'S-1023', name: 'Alex Johnson', deceleration: -4.2, axis: 'Cross-domain Links', status: 'critical' },
      { studentId: 'S-1045', name: 'Maria Garcia', deceleration: -2.8, axis: 'Reasoning Structure', status: 'warning' },
      { studentId: 'S-1089', name: 'James Smith', deceleration: -1.5, axis: 'Vocabulary Expansion', status: 'watch' },
    ];
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
};
