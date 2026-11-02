import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  ArrowLeft, Users, Phone, Mail, Theater, Calendar, 
  Loader2, Pencil, AlertTriangle, Shield, Star, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import CrewMemberForm from '../components/crew/CrewMemberForm';
import AvailabilityManager from '../components/crew/AvailabilityManager';
import SkillManager from '../components/crew/SkillManager';
import CrewOnboardingManager from '../components/crew/CrewOnboardingManager';
import { useCurrentUser } from '../components/auth/RoleGuard';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-slate-100 text-slate-700',
  on_leave: 'bg-amber-100 text-amber-700',
};

const assignmentStatusColors = {
  assigned: 'bg-slate-100 text-slate-700',
  confirmed: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
};

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
  other: 'Other',
};

export default function CrewMemberDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const memberId = urlParams.get('id');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const { user, loading: userLoading, isAdmin } = useCurrentUser();

  const { data: member, isLoading } = useQuery({
    queryKey: ['crewMember', memberId],
    queryFn: () => base44.entities.CrewMember.filter({ id: memberId }),
    select: (data) => data[0],
    enabled: !!memberId,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['memberAssignments', memberId],
    queryFn: () => base44.entities.CrewAssignment.filter({ crew_member_id: memberId }),
    enabled: !!memberId,
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list(),
  });

  const getProduction = (prodId) => productions.find(p => p.id === prodId);

  if (isLoading || userLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Check if user can view this crew member (admin can view all, regular users can only view themselves)
  const canViewMember = isAdmin || (user?.email && member?.email === user.email);
  const canEdit = isAdmin;

  if (!member) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-1">Crew member not found</h3>
        <Link to={createPageUrl('CrewMembers')}>
          <Button variant="link">Back to Crew Members</Button>
        </Link>
      </div>
    );
  }

  const activeAssignments = assignments.filter(a => ['assigned', 'confirmed', 'active'].includes(a.status));
  const pastAssignments = assignments.filter(a => ['completed', 'cancelled'].includes(a.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('CrewMembers')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-indigo-600">
                {member.full_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{member.full_name}</h1>
                <Badge className={statusColors[member.status]}>{member.status}</Badge>
              </div>
              <p className="text-slate-500">{roleLabels[member.primary_role]}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {(canEdit || (user?.email && member?.email === user.email)) && (
            <>
              <Button onClick={() => setShowAvailability(true)} variant="outline" size="sm">
                <Clock className="w-4 h-4 mr-2" />
                Availability
              </Button>
              <Button onClick={() => setShowSkills(true)} variant="outline" size="sm">
                <Star className="w-4 h-4 mr-2" />
                Skills
              </Button>
            </>
          )}
          {canEdit && (
            <Button onClick={() => setShowEditForm(true)} variant="outline" size="sm">
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
        {!isAdmin && (
          <Badge variant="outline" className="text-slate-500">
            <Shield className="w-3 h-3 mr-1" />
            View Only
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {member.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a href={`mailto:${member.email}`} className="text-blue-600 hover:underline">
                    {member.email}
                  </a>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${member.phone}`} className="hover:underline">
                    {member.phone}
                  </a>
                </div>
              )}
              {member.emergency_contact && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Emergency Contact
                  </p>
                  <p className="text-sm">{member.emergency_contact}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {member.secondary_roles && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills & Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-indigo-100 text-indigo-700">{roleLabels[member.primary_role]}</Badge>
                  {member.secondary_roles.split(',').map((role, i) => (
                    <Badge key={i} variant="outline">{role.trim()}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {member.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{member.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Assignments ({activeAssignments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {activeAssignments.length === 0 ? (
                <p className="text-center py-6 text-slate-500">No active assignments</p>
              ) : (
                <div className="space-y-3">
                  {activeAssignments.map((assignment) => {
                    const production = getProduction(assignment.production_id);
                    return (
                      <div key={assignment.id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                              <Theater className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <Link 
                                to={createPageUrl(`ProductionDashboard?id=${assignment.production_id}`)}
                                className="font-medium text-slate-900 hover:text-blue-600"
                              >
                                {production?.name || 'Unknown Production'}
                              </Link>
                              <p className="text-sm text-slate-500">{roleLabels[assignment.role]}</p>
                              {(assignment.start_date || assignment.end_date) && (
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {assignment.start_date && format(new Date(assignment.start_date), 'MMM d')}
                                  {assignment.end_date && ` - ${format(new Date(assignment.end_date), 'MMM d')}`}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge className={assignmentStatusColors[assignment.status]}>{assignment.status}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {pastAssignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Past Assignments ({pastAssignments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pastAssignments.map((assignment) => {
                    const production = getProduction(assignment.production_id);
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                        <div>
                          <span className="font-medium text-slate-700">{production?.name}</span>
                          <span className="text-sm text-slate-500 ml-2">({roleLabels[assignment.role]})</span>
                        </div>
                        <Badge className={assignmentStatusColors[assignment.status]}>{assignment.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <CrewOnboardingManager 
            crewMemberId={member.id}
            crewMemberName={member.full_name}
          />
        </div>
      </div>

      <CrewMemberForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        member={member}
      />

      <AvailabilityManager
        open={showAvailability}
        onClose={() => setShowAvailability(false)}
        crewMember={member}
      />

      <SkillManager
        open={showSkills}
        onClose={() => setShowSkills(false)}
        crewMember={member}
        currentUser={user}
      />
    </div>
  );
}