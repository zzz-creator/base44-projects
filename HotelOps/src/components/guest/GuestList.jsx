import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Star } from 'lucide-react';

export default function GuestList({ guests = [], onGuestClick }) {
  const getStatusBadge = (status) => {
    const variants = {
      checked_in: { variant: "default", label: "Checked In" },
      checked_out: { variant: "secondary", label: "Checked Out" },
      reserved: { variant: "outline", label: "Reserved" },
      cancelled: { variant: "destructive", label: "Cancelled" }
    };
    const config = variants[status] || variants.reserved;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wide">Active Guests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guests.map((guest) => (
              <TableRow 
                key={guest.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => onGuestClick && onGuestClick(guest)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {guest.vip_status && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                    {guest.first_name} {guest.last_name}
                  </div>
                </TableCell>
                <TableCell>{guest.email}</TableCell>
                <TableCell>{guest.phone || 'N/A'}</TableCell>
                <TableCell>{getStatusBadge(guest.status)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {guest.loyalty_tier || 'standard'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}