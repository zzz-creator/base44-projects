import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Star, Plus, Trash2, Award, ThumbsUp } from 'lucide-react';

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'bg-slate-100 text-slate-700' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-blue-100 text-blue-700' },
  { value: 'advanced', label: 'Advanced', color: 'bg-purple-100 text-purple-700' },
  { value: 'expert', label: 'Expert', color: 'bg-amber-100 text-amber-700' },
];

const SUGGESTED_SKILLS = [
  'Rigging', 'Lighting Design', 'Sound Mixing', 'Stage Combat', 'Prop Making',
  'Sewing', 'Carpentry', 'Welding', 'CAD/Vectorworks', 'DMX Programming',
  'Audio Engineering', 'Video Projection', 'Pyrotechnics', 'Makeup/SFX',
  'First Aid', 'Forklift Operation', 'Working at Heights'
];

export default function SkillManager({ open, onClose, crewMember, currentUser }) {
  const queryClient = useQueryClient();

  const [skills, setSkills] = useState([]);
  const [skillLevels, setSkillLevels] = useState({});
  const [endorsements, setEndorsements] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('intermediate');

  useEffect(() => {
    if (crewMember) {
      const skillList = crewMember.skills ? crewMember.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
      setSkills(skillList);
      
      try {
        setSkillLevels(crewMember.skill_levels ? JSON.parse(crewMember.skill_levels) : {});
      } catch { setSkillLevels({}); }
      
      try {
        setEndorsements(crewMember.skill_endorsements ? JSON.parse(crewMember.skill_endorsements) : []);
      } catch { setEndorsements([]); }
    }
  }, [crewMember]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CrewMember.update(crewMember.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crewMembers'] });
      queryClient.invalidateQueries({ queryKey: ['crewMember'] });
    },
  });

  const handleAddSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      const updatedSkills = [...skills, newSkill];
      const updatedLevels = { ...skillLevels, [newSkill]: newSkillLevel };
      setSkills(updatedSkills);
      setSkillLevels(updatedLevels);
      setNewSkill('');
      setNewSkillLevel('intermediate');
      
      updateMutation.mutate({
        skills: updatedSkills.join(', '),
        skill_levels: JSON.stringify(updatedLevels),
      });
    }
  };

  const handleRemoveSkill = (skill) => {
    const updatedSkills = skills.filter(s => s !== skill);
    const updatedLevels = { ...skillLevels };
    delete updatedLevels[skill];
    const updatedEndorsements = endorsements.filter(e => e.skill !== skill);
    
    setSkills(updatedSkills);
    setSkillLevels(updatedLevels);
    setEndorsements(updatedEndorsements);
    
    updateMutation.mutate({
      skills: updatedSkills.join(', '),
      skill_levels: JSON.stringify(updatedLevels),
      skill_endorsements: JSON.stringify(updatedEndorsements),
    });
  };

  const handleUpdateLevel = (skill, level) => {
    const updatedLevels = { ...skillLevels, [skill]: level };
    setSkillLevels(updatedLevels);
    updateMutation.mutate({
      skill_levels: JSON.stringify(updatedLevels),
    });
  };

  const handleEndorse = (skill) => {
    if (!currentUser) return;
    
    const existingEndorsement = endorsements.find(
      e => e.skill === skill && e.endorsed_by === currentUser.email
    );
    
    if (existingEndorsement) return;
    
    const newEndorsement = {
      skill,
      endorsed_by: currentUser.email,
      endorsed_by_name: currentUser.full_name,
      date: new Date().toISOString().split('T')[0],
    };
    
    const updatedEndorsements = [...endorsements, newEndorsement];
    setEndorsements(updatedEndorsements);
    
    updateMutation.mutate({
      skill_endorsements: JSON.stringify(updatedEndorsements),
    });
  };

  const getEndorsementCount = (skill) => {
    return endorsements.filter(e => e.skill === skill).length;
  };

  const hasEndorsed = (skill) => {
    return currentUser && endorsements.some(
      e => e.skill === skill && e.endorsed_by === currentUser.email
    );
  };

  const suggestedSkillsToShow = SUGGESTED_SKILLS.filter(s => !skills.includes(s));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Skills & Endorsements - {crewMember?.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Skills */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Current Skills</Label>
            {skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No skills added yet</p>
            ) : (
              <div className="space-y-2">
                {skills.map(skill => {
                  const level = skillLevels[skill] || 'intermediate';
                  const levelConfig = SKILL_LEVELS.find(l => l.value === level);
                  const endorsementCount = getEndorsementCount(skill);
                  
                  return (
                    <div key={skill} className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-medium text-sm">{skill}</span>
                        <Badge className={levelConfig?.color}>{levelConfig?.label}</Badge>
                        {endorsementCount > 0 && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <ThumbsUp className="w-3 h-3" />
                            {endorsementCount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Select
                          value={level}
                          onValueChange={(value) => handleUpdateLevel(skill, value)}
                        >
                          <SelectTrigger className="w-28 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SKILL_LEVELS.map(l => (
                              <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {currentUser && currentUser.email !== crewMember.email && (
                          <Button
                            variant={hasEndorsed(skill) ? 'secondary' : 'outline'}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleEndorse(skill)}
                            disabled={hasEndorsed(skill)}
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500"
                          onClick={() => handleRemoveSkill(skill)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add New Skill */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Add New Skill</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter skill name..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                className="flex-1"
              />
              <Select value={newSkillLevel} onValueChange={setNewSkillLevel}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddSkill} disabled={!newSkill || updateMutation.isPending}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Suggested Skills */}
          {suggestedSkillsToShow.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Suggested Skills</Label>
              <div className="flex flex-wrap gap-1">
                {suggestedSkillsToShow.slice(0, 10).map(skill => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => setNewSkill(skill)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Endorsements List */}
          {endorsements.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Award className="w-4 h-4" />
                Recent Endorsements
              </Label>
              <div className="space-y-1 text-sm">
                {endorsements.slice(-5).reverse().map((endorsement, index) => (
                  <div key={index} className="text-muted-foreground">
                    <span className="font-medium text-foreground">{endorsement.endorsed_by_name}</span>
                    {' '}endorsed{' '}
                    <span className="font-medium text-foreground">{endorsement.skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}