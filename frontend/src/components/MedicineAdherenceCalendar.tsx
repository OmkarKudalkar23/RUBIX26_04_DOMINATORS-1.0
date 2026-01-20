import { motion } from "motion/react";

interface MedicineTaking {
  date: string;
  time: string;
  taken: boolean;
  takenAt?: string;
}

interface Medicine {
  id: string;
  name: string;
  times: string[];
  takings: MedicineTaking[];
  completed: boolean;
}

interface MedicineAdherenceCalendarProps {
  medicines: Medicine[];
  onDateClick: (date: string) => void;
  isDarkMode: boolean;
  textPrimary: string;
  textSecondary: string;
}

export function MedicineAdherenceCalendar({ 
  medicines, 
  onDateClick, 
  isDarkMode,
  textPrimary,
  textSecondary 
}: MedicineAdherenceCalendarProps) {
  // Generate calendar data for the full year
  const generateCalendarData = () => {
    const data: Array<{
      date: string;
      adherence: number;
      dayOfWeek: number;
      weekIndex: number;
      monthYear: string;
    }> = [];
    
    const today = new Date();
    
    // Start from 365 days ago
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    
    // Find the first Sunday before or on start date
    const firstDay = new Date(startDate);
    const dayOfWeek = firstDay.getDay();
    if (dayOfWeek !== 0) {
      firstDay.setDate(firstDay.getDate() - dayOfWeek);
    }
    
    // Generate 53 weeks
    for (let week = 0; week < 53; week++) {
      for (let day = 0; day < 7; day++) {
        const date = new Date(firstDay);
        date.setDate(date.getDate() + (week * 7) + day);
        
        // Only include dates within our year range
        if (date >= startDate && date <= today) {
          const dateStr = date.toISOString().split('T')[0];
          const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          
          // Calculate adherence
          let totalDoses = 0;
          let takenDoses = 0;
          
          medicines.forEach(medicine => {
            if (!medicine.completed) {
              const dayTakings = medicine.takings.filter(t => t.date === dateStr);
              totalDoses += dayTakings.length;
              takenDoses += dayTakings.filter(t => t.taken).length;
            }
          });
          
          const adherence = totalDoses > 0 ? takenDoses / totalDoses : 0;
          
          data.push({
            date: dateStr,
            adherence,
            dayOfWeek: day,
            weekIndex: week,
            monthYear
          });
        }
      }
    }
    
    return data;
  };

  const calendarData = generateCalendarData();
  
  // Get max week index
  const maxWeek = Math.max(...calendarData.map(d => d.weekIndex));
  
  // Organize data into grid [day][week]
  const grid: Array<Array<{ date: string; adherence: number; monthYear: string } | null>> = Array(7)
    .fill(null)
    .map(() => Array(maxWeek + 1).fill(null));
    
  calendarData.forEach(day => {
    grid[day.dayOfWeek][day.weekIndex] = {
      date: day.date,
      adherence: day.adherence,
      monthYear: day.monthYear
    };
  });

  // Generate month labels with year
  const monthLabels: Array<{ label: string; weekIndex: number }> = [];
  let currentMonthYear = '';
  
  for (let week = 0; week <= maxWeek; week++) {
    const dayInWeek = grid[0][week] || grid[1][week] || grid[2][week] || grid[3][week] || 
                      grid[4][week] || grid[5][week] || grid[6][week];
    
    if (dayInWeek) {
      const monthYear = dayInWeek.monthYear;
      
      if (monthYear !== currentMonthYear) {
        monthLabels.push({ label: monthYear, weekIndex: week });
        currentMonthYear = monthYear;
      }
    }
  }

  // Get blue color based on adherence
  const getBlueColor = (adherence: number) => {
    if (adherence === 0) {
      return '#EBEDF0'; // Light grey for no data
    } else if (adherence <= 0.25) {
      return '#C6E0F5'; // Very light blue
    } else if (adherence <= 0.5) {
      return '#73B9EC'; // Light blue
    } else if (adherence <= 0.75) {
      return '#3B82F6'; // Medium blue
    } else {
      return '#1E40AF'; // Dark blue
    }
  };

  const cellSize = 11; // Size of each square
  const cellGap = 3; // Gap between squares
  const weeksPerRow = 26; // Split into 2 rows
  
  // Split weeks into rows
  const rows: number[][] = [];
  for (let i = 0; i <= maxWeek; i += weeksPerRow) {
    rows.push(Array.from({ length: Math.min(weeksPerRow, maxWeek - i + 1) }, (_, j) => i + j));
  }

  return (
    <div className="bg-white rounded-3xl p-6">
      <div className="space-y-8">
        {rows.map((rowWeeks, rowIndex) => {
          // Get month labels for this row
          const rowMonthLabels = monthLabels.filter(m => 
            rowWeeks[0] <= m.weekIndex && m.weekIndex <= rowWeeks[rowWeeks.length - 1]
          );
          
          return (
            <div key={rowIndex}>
              {/* Month labels for this row */}
              <div className="flex mb-2" style={{ marginLeft: '42px' }}>
                {rowMonthLabels.map((month, idx) => {
                  const relativeWeek = month.weekIndex - rowWeeks[0];
                  const prevWeek = idx > 0 ? rowMonthLabels[idx - 1].weekIndex - rowWeeks[0] : 0;
                  const offset = relativeWeek - prevWeek;
                  
                  return (
                    <div
                      key={idx}
                      className="text-xs text-gray-600"
                      style={{
                        marginLeft: idx === 0 ? `${relativeWeek * (cellSize + cellGap)}px` : `${offset * (cellSize + cellGap)}px`,
                        fontFamily: "'Doto', sans-serif",
                        fontWeight: "600"
                      }}
                    >
                      {month.label}
                    </div>
                  );
                })}
              </div>

              {/* Grid container */}
              <div className="flex">
                {/* Day labels */}
                <div 
                  className="flex flex-col justify-around text-xs text-gray-600 pr-2" 
                  style={{ 
                    width: '38px',
                    height: `${7 * cellSize + 6 * cellGap}px`,
                    fontFamily: "'Doto', sans-serif",
                    fontWeight: "500"
                  }}
                >
                  <div className="flex items-center justify-end" style={{ height: `${cellSize}px` }}>Mon</div>
                  <div className="flex items-center justify-end" style={{ height: `${cellSize}px` }}>Wed</div>
                  <div className="flex items-center justify-end" style={{ height: `${cellSize}px` }}>Fri</div>
                </div>

                {/* Calendar grid - organized by weeks (columns) */}
                <div className="flex" style={{ gap: `${cellGap}px` }}>
                  {rowWeeks.map((weekIdx) => (
                    <div key={weekIdx} className="flex flex-col" style={{ gap: `${cellGap}px` }}>
                      {grid.map((row, dayIdx) => {
                        const day = row[weekIdx];
                        
                        if (!day) {
                          return (
                            <div
                              key={dayIdx}
                              style={{ 
                                width: `${cellSize}px`, 
                                height: `${cellSize}px`,
                              }}
                            />
                          );
                        }

                        return (
                          <motion.button
                            key={day.date}
                            whileHover={{ scale: 1.3 }}
                            onClick={() => onDateClick(day.date)}
                            className="rounded-sm transition-all"
                            style={{
                              width: `${cellSize}px`,
                              height: `${cellSize}px`,
                              backgroundColor: getBlueColor(day.adherence)
                            }}
                            title={`${day.date}: ${Math.round(day.adherence * 100)}% adherence`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-6 text-xs text-gray-600" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "500" }}>
        <span>Less</span>
        <div className="flex" style={{ gap: `${cellGap}px` }}>
          <div className="rounded-sm" style={{ width: `${cellSize}px`, height: `${cellSize}px`, backgroundColor: '#EBEDF0' }} />
          <div className="rounded-sm" style={{ width: `${cellSize}px`, height: `${cellSize}px`, backgroundColor: '#C6E0F5' }} />
          <div className="rounded-sm" style={{ width: `${cellSize}px`, height: `${cellSize}px`, backgroundColor: '#73B9EC' }} />
          <div className="rounded-sm" style={{ width: `${cellSize}px`, height: `${cellSize}px`, backgroundColor: '#3B82F6' }} />
          <div className="rounded-sm" style={{ width: `${cellSize}px`, height: `${cellSize}px`, backgroundColor: '#1E40AF' }} />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
