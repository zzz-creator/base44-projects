import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Sparkles, MapPin, Utensils, Dumbbell, Coffee, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PersonalizedRecommendations({ guestData }) {
  const [recommendations, setRecommendations] = useState(null);

  const generateRecommendations = useMutation({
    mutationFn: async () => {
      const prompt = `You are a hotel concierge AI. Generate personalized recommendations for a guest.

Guest Profile:
- Name: ${guestData?.first_name} ${guestData?.last_name}
- Loyalty Tier: ${guestData?.loyalty_tier || 'standard'}
- VIP Status: ${guestData?.vip_status ? 'Yes' : 'No'}

Generate 6 personalized recommendations in these categories:
1. Hotel Amenities (2 recommendations)
2. Dining Options (2 recommendations)  
3. Local Attractions (2 recommendations)

For each recommendation, provide:
- title (short, catchy)
- description (1-2 sentences)
- category (amenities/dining/attractions)
- icon_suggestion (gym/coffee/utensils/map-pin)

Return as JSON array.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  icon_suggestion: { type: "string" }
                }
              }
            }
          }
        }
      });

      return result.recommendations;
    },
    onSuccess: (data) => {
      setRecommendations(data);
      toast.success('Recommendations generated!');
    },
    onError: () => {
      toast.error('Failed to generate recommendations');
    }
  });

  const getIcon = (iconName) => {
    const icons = {
      'gym': Dumbbell,
      'coffee': Coffee,
      'utensils': Utensils,
      'map-pin': MapPin
    };
    return icons[iconName] || Sparkles;
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'amenities': return 'bg-blue-100 text-blue-800';
      case 'dining': return 'bg-orange-100 text-orange-800';
      case 'attractions': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          Personalized Recommendations
        </CardTitle>
        <CardDescription>
          {guestData ? `Curated for ${guestData.first_name} ${guestData.last_name}` : 'Discover experiences tailored for you'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!recommendations ? (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-300" />
            <p className="text-slate-600 mb-4">Get AI-powered recommendations based on your profile</p>
            <Button 
              onClick={() => generateRecommendations.mutate()}
              disabled={generateRecommendations.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generateRecommendations.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get Recommendations
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec, index) => {
                const Icon = getIcon(rec.icon_suggestion);
                return (
                  <Card key={index} className="border-2 hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold">{rec.title}</h3>
                            <Badge className={getCategoryColor(rec.category)}>
                              {rec.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">{rec.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => generateRecommendations.mutate()}
              disabled={generateRecommendations.isPending}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Refresh Recommendations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}