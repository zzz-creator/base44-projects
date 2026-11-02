import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { 
  MapPin, 
  Plus, 
  Search, 
  MoreVertical,
  Pencil,
  Trash2,
  Box,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import AssetLocationForm from '../components/locations/AssetLocationForm';

export default function AssetLocations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const queryClient = useQueryClient();

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['assetLocations'],
    queryFn: () => base44.entities.AssetLocation.list('-created_date'),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.EquipmentAsset.list(),
  });

  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AssetLocation.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assetLocations'] }),
  });

  const getAssetCount = (locationId) => {
    return assets.filter(a => a.location_id === locationId).length;
  };

  const getVenueName = (venueId) => {
    const venue = venues.find(v => v.id === venueId);
    return venue?.name || '';
  };

  const filteredLocations = locations.filter(location =>
    location.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (location) => {
    setEditingLocation(location);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingLocation(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Asset Locations</h1>
          <p className="text-slate-500">Manage storage and equipment locations</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Locations Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filteredLocations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No locations found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm ? 'Try a different search term' : 'Add your first storage location'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location) => (
            <Card key={location.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{location.location_name}</h3>
                      {location.venue_id && (
                        <p className="text-xs text-slate-500">{getVenueName(location.venue_id)}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(location)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteMutation.mutate(location.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {location.description && (
                  <p className="text-sm text-slate-600 mb-3">{location.description}</p>
                )}

                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Box className="w-4 h-4" />
                  <span>{getAssetCount(location.id)} assets</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AssetLocationForm
        open={showForm}
        onClose={handleCloseForm}
        location={editingLocation}
        venues={venues}
      />
    </div>
  );
}