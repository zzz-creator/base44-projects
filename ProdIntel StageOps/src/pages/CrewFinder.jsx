import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  Search,
  Users,
  Filter,
  Calendar,
  Award,
  Star,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { format, isWithinInterval, parseISO } from 'date-fns';

const roleLabels = {
  stage_manager: 'Stage Manager',
  lighting: 'Lighting',
  sound: 'Sound',
  props: 'Props',
  wardrobe: 'Wardrobe',
  set: 'Set',
  technical_director: 'Technical Director',
  rigger: 'Rigger',
  carpenter: 'Carpenter',
  electrician: 'Electrician',
  other: 'Other'
};

const roleColors = {
  stage_manager: 'bg-purple-100 text-purple-700',
  lighting: 'bg-amber-100 text-amber-700',
  sound: 'bg-blue-100 text-blue-700',
  props: 'bg-green-100 text-green-700',
  wardrobe: 'bg-pink-100 text-pink-700',
  set: 'bg-orange-100 text-orange-700',
  technical_director: 'bg-indigo-100 text-indigo-700',
  rigger: 'bg-red-100 text-red-700',
  carpenter: 'bg-yellow-100 text-yellow-700',
  electrician: 'bg-cyan-100 text-cyan-700',
  other: 'bg-slate-100 text-slate-700'
};

export default function CrewFinder() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('');
  const [availabilityStart, setAvailabilityStart] = useState('');
  const [availabilityEnd, setAvailabilityEnd] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedMember, setExpandedMember] = useState(null);

  const { data: crewMembers = [], isLoading } = useQuery({
    queryKey: ['crewMembers'],
    queryFn: () => base44.entities.CrewMember.list('-created_date'),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['crewAssignments'],
    queryFn: () => base44.entities.CrewAssignment.list(),
  });

  // Check if crew member is available for given dates
  const isAvailableForDates = (member, startDate, endDate) => {
    if (!startDate || !endDate) return true;
    
    // Check blocked dates
    try {
      const blockedDates = member.blocked_dates ? JSON.parse(member.blocked_dates) : [];
      for (const blocked of blockedDates) {
        if (blocked.start_date && blocked.end_date) {
          const blockedStart = parseISO(blocked.start_date);
          const blockedEnd = parseISO(blocked.end_date);
          const reqStart = parseISO(startDate);
          const reqEnd = parseISO(endDate);
          
          // Check for overlap
          if (reqStart <= blockedEnd && reqEnd >= blockedStart) {
            return false;
          }
        }
      }
    } catch {
      // Invalid JSON, ignore
    }

    // Check existing assignments
    const memberAssignments = assignments.filter(a => 
      a.crew_member_id === member.id && 
      a.status !== 'cancelled' && 
      a.status !== 'completed'
    );

    for (const assignment of memberAssignments) {
      if (assignment.start_date && assignment.end_date) {
        const assignStart = parseISO(assignment.start_date);
        const assignEnd = parseISO(assignment.end_date);
        const reqStart = parseISO(startDate);
        const reqEnd = parseISO(endDate);
        
        if (reqStart <= assignEnd && reqEnd >= assignStart) {
          return false;
        }
      }
    }

    return true;
  };

  // Get all unique skills from crew members
  const allSkills = useMemo(() => {
    const skills = new Set();
    crewMembers.forEach(member => {
      if (member.skills) {
        member.skills.split(',').forEach(s => skills.add(s.trim().toLowerCase()));
      }
    });
    return [...skills].sort();
  }, [crewMembers]);

  // Filter crew members
  const filteredMembers = useMemo(() => {
    return crewMembers.filter(member => {
      // Status filter - only active
      if (member.status !== 'active') return false;

      // Search filter
      const matchesSearch = 
        member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Role filter
      if (roleFilter !== 'all') {
        const hasRole = member.primary_role === roleFilter || 
          member.secondary_roles?.toLowerCase().includes(roleFilter);
        if (!hasRole) return false;
      }

      // Skill filter
      if (skillFilter) {
        const memberSkills = member.skills?.toLowerCase() || '';
        if (!memberSkills.includes(skillFilter.toLowerCase())) return false;
      }

      // Availability filter
      if (availabilityStart && availabilityEnd) {
        if (!isAvailableForDates(member, availabilityStart, availabilityEnd)) {
          return false;
        }
      }

      return true;
    });
  }, [crewMembers, searchTerm, roleFilter, skillFilter, availabilityStart, availabilityEnd, assignments]);

  const getCertifications = (member) => {
    try {
      return member.certifications ? JSON.parse(member.certifications) : [];
    } catch {
      return [];
    }
  };

  const getEndorsements = (member) => {
    try {
      return member.skill_endorsements ? JSON.parse(member.skill_endorsements) : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-6 h-6" />
            Crew Finder
          </h1>
          <p className="text-slate-500">Find available crew members by role, skills, and availability</p>
        </div>
        <Link to={createPageUrl('CrewMembers')}>
          <Button variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Manage Crew
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[250px]">
              <Label className="text-xs mb-1 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-[160px]">
              <Label className="text-xs mb-1 block">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide' : 'More'} Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs mb-1 block">Skills</Label>
                <Select value={skillFilter} onValueChange={setSkillFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Skill" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Any Skill</SelectItem>
                    {allSkills.map(skill => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Available From</Label>
                <Input
                  type="date"
                  value={availabilityStart}
                  onChange={(e) => setAvailabilityStart(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Available Until</Label>
                <Input
                  type="date"
                  value={availabilityEnd}
                  onChange={(e) => setAvailabilityEnd(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Found <span className="font-semibold">{filteredMembers.length}</span> crew member{filteredMembers.length !== 1 ? 's' : ''}
        </p>
        {(availabilityStart && availabilityEnd) && (
          <Badge variant="outline" className="gap-1">
            <Calendar className="w-3 h-3" />
            Checking: {format(parseISO(availabilityStart), 'MMM d')} - {format(parseISO(availabilityEnd), 'MMM d')}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No matching crew members</h3>
            <p className="text-slate-500">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const certifications = getCertifications(member);
            const endorsements = getEndorsements(member);
            const isExpanded = expandedMember === member.id;

            return (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-semibold text-indigo-600">
                        {member.full_name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={createPageUrl(`CrewMemberDetail?id=${member.id}`)}
                        className="font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {member.full_name}
                      </Link>
                      <Badge className={`ml-2 ${roleColors[member.primary_role]}`}>
                        {roleLabels[member.primary_role]}
                      </Badge>
                      {member.hourly_rate && (
                        <p className="text-sm text-slate-600 mt-1">
                          ${member.hourly_rate}/hr
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {availabilityStart && availabilityEnd ? (
                        isAvailableForDates(member, availabilityStart, availabilityEnd) ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )
                      ) : null}
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    {member.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </span>
                    )}
                    {member.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {member.phone}
                      </span>
                    )}
                  </div>

                  {/* Skills */}
                  {member.skills && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {member.skills.split(',').slice(0, 4).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {skill.trim()}
                        </Badge>
                      ))}
                      {member.skills.split(',').length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{member.skills.split(',').length - 4} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Certifications */}
                  {certifications.length > 0 && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-amber-600">
                      <Award className="w-3 h-3" />
                      <span>{certifications.length} certification{certifications.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {/* Endorsements count */}
                  {endorsements.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-purple-600 mt-1">
                      <Star className="w-3 h-3" />
                      <span>{endorsements.length} endorsement{endorsements.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {/* Expand/Actions */}
                  <div className="mt-4 pt-3 border-t flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                      className="text-xs"
                    >
                      {isExpanded ? 'Less' : 'More'} Details
                      {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                    </Button>
                    <Link to={createPageUrl(`CrewMemberDetail?id=${member.id}`)}>
                      <Button size="sm" variant="outline" className="text-xs">
                        View Profile
                      </Button>
                    </Link>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t space-y-3 text-sm">
                      {member.secondary_roles && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Secondary Roles</p>
                          <p className="text-slate-700">{member.secondary_roles}</p>
                        </div>
                      )}
                      {certifications.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Certifications</p>
                          <div className="space-y-1">
                            {certifications.map((cert, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Award className="w-3 h-3 text-amber-500" />
                                <span className="text-slate-700">{cert.name}</span>
                                {cert.expiry_date && (
                                  <span className="text-xs text-slate-400">
                                    (exp: {cert.expiry_date})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {member.notes && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
                          <p className="text-slate-700">{member.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}