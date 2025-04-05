import { useTours } from "@/hooks/useTours";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const TourStats = () => {
  const { activeTour } = useTours();

  const { data: stats, isLoading } = useQuery({
    queryKey: activeTour ? ['/api/tours/' + activeTour.id + '/stats'] : [],
    enabled: !!activeTour,
  });

  if (!activeTour) {
    return null;
  }

  return (
    <div>
      <h2 className="font-inter font-semibold text-lg mb-4">Tour Stats</h2>
      
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-3 rounded-md shadow-card">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-md shadow-card">
            <p className="text-sm text-gray-500">Total Shows</p>
            <p className="text-xl font-medium">{stats.totalShows}</p>
          </div>
          <div className="bg-white p-3 rounded-md shadow-card">
            <p className="text-sm text-gray-500">Confirmed</p>
            <p className="text-xl font-medium text-secondary">{stats.confirmed}</p>
          </div>
          <div className="bg-white p-3 rounded-md shadow-card">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-xl font-medium text-accent">{stats.pending}</p>
          </div>
          <div className="bg-white p-3 rounded-md shadow-card">
            <p className="text-sm text-gray-500">Open Dates</p>
            <p className="text-xl font-medium text-primary">{stats.openDates}</p>
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-sm">Stats not available</div>
      )}
    </div>
  );
};

export default TourStats;
