import React, { useState } from 'react';
import { db } from '../dataClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Star, ThumbsUp, CheckCircle2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function GuestFeedback() {
  const queryClient = useQueryClient();
  const [accessCode, setAccessCode] = useState('');
  const [guestData, setGuestData] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [ratings, setRatings] = useState({
    overall_rating: 0,
    room_rating: 0,
    dining_rating: 0,
    staff_rating: 0,
    cleanliness_rating: 0,
    amenities_rating: 0
  });
  const [feedbackText, setFeedbackText] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(null);

  const lookupMutation = useMutation({
    mutationFn: async () => {
      const passes = await db.entities.AccessPass.filter({ 
        pass_code: accessCode
      });

      if (passes.length === 0) throw new Error('Invalid access code');

      const pass = passes[0];
      const guests = await db.entities.Guest.list();
      const guest = guests.find(g => g.id === pass.guest_id);
      
      const reservations = await db.entities.Reservation.filter({ 
        guest_id: pass.guest_id
      });

      if (reservations.length === 0) throw new Error('No reservation found');

      return { guest, reservation: reservations[0], pass };
    },
    onSuccess: (data) => {
      setGuestData(data);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async () => {
      // Analyze sentiment using AI
      const sentimentPrompt = `Analyze the sentiment of this hotel guest feedback and return a sentiment score from -1 (very negative) to 1 (very positive).

Feedback: "${feedbackText}"

Return only a number between -1 and 1.`;

      const sentimentResult = await db.integrations.Core.InvokeLLM({
        prompt: sentimentPrompt
      });

      const sentimentScore = parseFloat(sentimentResult) || 0;

      // Create feedback record
      const feedback = await db.entities.Feedback.create({
        guest_id: guestData.guest.id,
        reservation_id: guestData.reservation.id,
        overall_rating: ratings.overall_rating,
        room_rating: ratings.room_rating,
        dining_rating: ratings.dining_rating,
        staff_rating: ratings.staff_rating,
        cleanliness_rating: ratings.cleanliness_rating,
        amenities_rating: ratings.amenities_rating,
        feedback_text: feedbackText,
        would_recommend: wouldRecommend,
        sentiment_score: sentimentScore,
        status: 'submitted'
      });

      // Create analytics data entry
      await db.entities.AnalyticsData.create({
        metric_type: 'guest_satisfaction',
        metric_value: ratings.overall_rating,
        metric_date: new Date().toISOString(),
        domain: 'overall',
        metadata: {
          guest_id: guestData.guest.id,
          feedback_id: feedback.id,
          sentiment_score: sentimentScore,
          would_recommend: wouldRecommend,
          ratings: ratings
        }
      });

      return feedback;
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries();
      toast.success('Thank you for your feedback!');
    },
    onError: () => {
      toast.error('Failed to submit feedback');
    }
  });

  const StarRating = ({ value, onChange, label }) => {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= value
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-slate-200 text-slate-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Thank You!</CardTitle>
          <CardDescription>Your feedback has been submitted successfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-600">
              We appreciate you taking the time to share your experience. Your feedback helps us improve our services.
            </p>
          </div>
          <Button className="w-full" onClick={() => window.location.reload()}>
            Return to Kiosk
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (guestData) {
    const allRatingsProvided = Object.values(ratings).every(r => r > 0);
    const canSubmit = allRatingsProvided && wouldRecommend !== null;

    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Share Your Experience
          </CardTitle>
          <CardDescription>
            Hello {guestData.guest.first_name}! We'd love to hear about your stay
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); submitFeedbackMutation.mutate(); }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StarRating
                label="Overall Experience"
                value={ratings.overall_rating}
                onChange={(val) => setRatings({ ...ratings, overall_rating: val })}
              />
              <StarRating
                label="Room Quality"
                value={ratings.room_rating}
                onChange={(val) => setRatings({ ...ratings, room_rating: val })}
              />
              <StarRating
                label="Dining Experience"
                value={ratings.dining_rating}
                onChange={(val) => setRatings({ ...ratings, dining_rating: val })}
              />
              <StarRating
                label="Staff Service"
                value={ratings.staff_rating}
                onChange={(val) => setRatings({ ...ratings, staff_rating: val })}
              />
              <StarRating
                label="Cleanliness"
                value={ratings.cleanliness_rating}
                onChange={(val) => setRatings({ ...ratings, cleanliness_rating: val })}
              />
              <StarRating
                label="Amenities"
                value={ratings.amenities_rating}
                onChange={(val) => setRatings({ ...ratings, amenities_rating: val })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tell us more about your experience</Label>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your thoughts, suggestions, or any memorable moments..."
                className="h-32"
              />
            </div>

            <div className="space-y-2">
              <Label>Would you recommend our hotel to others?</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={wouldRecommend === true ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setWouldRecommend(true)}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={wouldRecommend === false ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setWouldRecommend(false)}
                >
                  No
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!canSubmit || submitFeedbackMutation.isPending}
              >
                Submit Feedback
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setGuestData(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500" />
          Guest Feedback
        </CardTitle>
        <CardDescription>Share your experience and help us improve</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); lookupMutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access_code">Access Code</Label>
            <Input
              id="access_code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="Enter your 6-digit access code"
              maxLength={6}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={lookupMutation.isPending}
          >
            {lookupMutation.isPending ? 'Loading...' : 'Continue'}
          </Button>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
            <p>Your feedback is important to us! Please use your access code to share your experience.</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}