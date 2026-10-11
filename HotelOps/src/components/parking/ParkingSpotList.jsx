import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Car, Wrench } from 'lucide-react';

export default function ParkingSpotList({ spots = [], onMarkMaintenance, onMarkAvailable, onReserveSpot }) {
  const getStatusBadge = (status) => {
    const variants = {
      available: { variant: "default", label: "Available" },
      occupied: { variant: "destructive", label: "Occupied" },
      reserved: { variant: "secondary", label: "Reserved" },
      maintenance: { variant: "outline", label: "Maintenance" }
    };
    const config = variants[status] || variants.available;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wide">Parking Spots</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Spot</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reserved For</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {spots.map((spot) => (
              <TableRow key={spot.id}>
                <TableCell className="font-medium">{spot.spot_number}</TableCell>
                <TableCell>{spot.level}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {spot.zone}
                  </Badge>
                </TableCell>
                <TableCell>{getStatusBadge(spot.status)}</TableCell>
                <TableCell>
                  {spot.reserved_for_room ? (
                    <span className="text-sm font-medium">Room {spot.reserved_for_room}</span>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </TableCell>
                <TableCell>${spot.rate_per_hour}/hr</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {spot.status === 'available' && onReserveSpot && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onReserveSpot(spot)}
                        className="text-xs"
                      >
                        Reserve
                      </Button>
                    )}
                    {spot.status === 'reserved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onMarkAvailable(spot.id)}
                        className="text-xs"
                      >
                        Release
                      </Button>
                    )}
                    {spot.status === 'maintenance' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onMarkAvailable(spot.id)}
                        className="text-xs"
                      >
                        Mark Available
                      </Button>
                    ) : spot.status !== 'reserved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onMarkMaintenance(spot.id)}
                        className="text-xs"
                      >
                        <Wrench className="w-3 h-3 mr-1" />
                        Maintenance
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}