import { ConversationState, ScenarioType, QuickReply, ConversationFlags, ConversationPhase, UserProfile } from '../types/conversationTypes';

export class ConversationFlowService {
  private state: ConversationState;

  constructor(initialProfile?: Partial<UserProfile>) {
    this.state = this.initializeState(initialProfile);
  }

  private initializeState(initialProfile?: Partial<UserProfile>): ConversationState {
    const emptyProfile: UserProfile = {
      age: undefined,
      sex: undefined,
      experienceLevel: undefined,
      primaryGoal: undefined,
      equipment: [],
      timePerSession: undefined,
      daysPerWeek: undefined,
      medical: {},
      lifestyle: {},
      dietary: {}
    };

    const flags: ConversationFlags = {
      needsMedicalClearance: false,
      hasPhysicalLimitations: false,
      needsMotivationalSupport: false,
      hasDietaryRestrictions: false,
      needsPrivacyConsiderations: false,
      requiresModifications: false
    };

    return {
      phase: 'greeting',
      collectedData: { ...emptyProfile, ...(initialProfile || {}) },
      missingFields: [],
      scenarioType: 'standard_beginner',
      customizations: [],
      flags
    };
  }

  detectScenario(userMessage: string, userProfile?: Partial<UserProfile>): ScenarioType {
    const lower = (userMessage || '').toLowerCase();

    if (lower.includes('injury') || lower.includes('hurt') || lower.includes('pain')) return 'injury_recovery';
    if (lower.includes('pregnant') || lower.includes('pregnancy')) return 'pregnancy';
    if (lower.includes('65') || lower.includes('senior') || lower.includes('elderly')) return 'senior';
    if (lower.includes('shift') || lower.includes('night work')) return 'shift_worker';
    if (lower.includes('kids') || lower.includes('children') || lower.includes('parent')) return 'busy_parent';
    if (lower.includes('travel') || lower.includes('business trips')) return 'traveler';
    if (lower.includes('depressed') || lower.includes('anxiety') || lower.includes('motivation')) return 'mental_health';
    if (lower.includes('scared') || lower.includes('intimidated') || lower.includes('nervous')) return 'gym_intimidation';
    if (lower.includes('beginner') || lower.includes('new to')) return 'standard_beginner';

    return 'standard_beginner';
  }

  updatePhase(phase: ConversationPhase): void {
    this.state.phase = phase;
  }

  getState(): ConversationState {
    return this.state;
  }

  getQuickReplies(aiMessage: string, scenario: ScenarioType): QuickReply[] {
    const lower = (aiMessage || '').toLowerCase();

    if (lower.includes('experience') || lower.includes('fitness level')) return this.getExperienceReplies(scenario);
    if (lower.includes('goal') || lower.includes('want to achieve')) return this.getGoalReplies(scenario);
    if (lower.includes('equipment') || lower.includes('where will you')) return this.getEquipmentReplies(scenario);
    if (lower.includes('time') || lower.includes('minutes')) return this.getTimeReplies(scenario);
    if (lower.includes('injury') || lower.includes('medical') || lower.includes('limitations')) return this.getMedicalReplies(scenario);
    if (lower.includes('diet') || lower.includes('allergies') || lower.includes('restrictions')) return this.getDietaryReplies(scenario);

    return [];
  }

  private getExperienceReplies(scenario: ScenarioType): QuickReply[] {
    const base: QuickReply[] = [
      { id: 'exp_beginner', text: 'Complete Beginner', value: 'beginner', icon: 'Beginner', category: 'experience' },
      { id: 'exp_some', text: 'Some Experience', value: 'intermediate', icon: 'Intermediate', category: 'experience' },
      { id: 'exp_advanced', text: 'Very Experienced', value: 'advanced', icon: 'Advanced', category: 'experience' }
    ];

    if (scenario === 'returning_user') {
      base.push({ id: 'exp_returning', text: 'Used to be fit', value: 'returning', icon: 'Returning', category: 'experience' });
    }
    return base;
  }

  private getGoalReplies(scenario: ScenarioType): QuickReply[] {
    const base: QuickReply[] = [
      { id: 'goal_weight_loss', text: 'Lose Weight', value: 'weight_loss', icon: 'WeightLoss', category: 'goal' },
      { id: 'goal_muscle', text: 'Build Muscle', value: 'muscle_building', icon: 'MuscleBuilding', category: 'goal' },
      { id: 'goal_strength', text: 'Get Stronger', value: 'strength', icon: 'Strength', category: 'goal' },
      { id: 'goal_general', text: 'Stay Healthy', value: 'general_fitness', icon: 'GeneralFitness', category: 'goal' }
    ];

    if (scenario === 'mental_health') {
      base.unshift({ id: 'goal_mental', text: 'Feel Better Mentally', value: 'mental_wellness', icon: 'MentalHealth', category: 'goal' });
    }
    if (scenario === 'senior') {
      base.push({ id: 'goal_mobility', text: 'Stay Mobile & Independent', value: 'mobility', icon: 'Mobility', category: 'goal' });
    }
    return base;
  }

  private getEquipmentReplies(_: ScenarioType): QuickReply[] {
    return [
      { id: 'equip_gym', text: 'Gym Membership', value: 'gym', icon: 'Strength', category: 'equipment' },
      { id: 'equip_home', text: 'At Home', value: 'home', icon: 'GeneralFitness', category: 'equipment' },
      { id: 'equip_outdoors', text: 'Outdoors', value: 'outdoors', icon: 'GeneralFitness', category: 'equipment' },
      { id: 'equip_unsure', text: 'Not Sure Yet', value: 'unsure', icon: 'Beginner', category: 'equipment' }
    ];
  }

  private getTimeReplies(_: ScenarioType): QuickReply[] {
    return [
      { id: 'time_15_20', text: '15-20 min', value: '15-20', icon: 'GeneralFitness', category: 'time' },
      { id: 'time_20_30', text: '20-30 min', value: '20-30', icon: 'GeneralFitness', category: 'time' },
      { id: 'time_30_45', text: '30-45 min', value: '30-45', icon: 'GeneralFitness', category: 'time' },
      { id: 'time_45_plus', text: '45+ min', value: '45+', icon: 'GeneralFitness', category: 'time' }
    ];
  }

  private getMedicalReplies(_: ScenarioType): QuickReply[] {
    return [
      { id: 'med_none', text: 'No Issues ✅', value: 'none', icon: 'GeneralFitness', category: 'medical' },
      { id: 'med_back', text: 'Back Problems', value: 'back', icon: 'Strength', category: 'medical' },
      { id: 'med_knee', text: 'Knee Issues', value: 'knee', icon: 'Strength', category: 'medical' },
      { id: 'med_other', text: 'Other Injury', value: 'other', icon: 'Beginner', category: 'medical' },
      { id: 'med_more', text: 'Tell Me More', value: 'more', icon: 'Intermediate', category: 'medical' }
    ];
  }

  private getDietaryReplies(_: ScenarioType): QuickReply[] {
    return [
      { id: 'diet_none', text: 'No Restrictions', value: 'none', icon: 'GeneralFitness', category: 'dietary' },
      { id: 'diet_veg', text: 'Vegetarian', value: 'vegetarian', icon: 'GeneralFitness', category: 'dietary' },
      { id: 'diet_vegan', text: 'Vegan', value: 'vegan', icon: 'GeneralFitness', category: 'dietary' },
      { id: 'diet_halal', text: 'Halal', value: 'halal', icon: 'GeneralFitness', category: 'dietary' },
      { id: 'diet_kosher', text: 'Kosher', value: 'kosher', icon: 'GeneralFitness', category: 'dietary' }
    ];
  }
}

export const conversationFlowService = new ConversationFlowService();




