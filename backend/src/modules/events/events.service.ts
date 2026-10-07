import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

const INITIAL_SEED_EVENTS = [
  {
    _id: 'evt_1',
    id: 'evt_1',
    title: 'Kandy Esala Perahera',
    description: 'The historic Kandy Esala Perahera cultural procession featuring traditional dancers and drum performances.',
    category: 'Cultural',
    eventType: 'Physical Event',
    audience: ['All Ages', 'Families'],
    locationName: 'Kandy Esala Perahera Ground',
    locationAddress: 'Kandy, Sri Lanka',
    city: 'Kandy',
    startDate: 'Aug 10, 2025',
    startTime: '6:00 PM',
    endDate: 'Aug 20, 2025',
    endTime: '11:00 PM',
    images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=600&auto=format&fit=crop'],
    isPaid: false,
    ticketPrice: 0,
    additionalInfo: { foodAndBeverages: true, wheelchairAccessible: false, familyFriendly: true },
    status: 'Upcoming',
    viewsCount: 12400,
    interestedCount: 1200,
    goingCount: 850,
    organizerId: 'organizer_host_1',
  },
  {
    _id: 'evt_2',
    id: 'evt_2',
    title: 'Colombo Food Festival',
    description: 'A culinary festival featuring authentic Sri Lankan street food, desserts, and live music.',
    category: 'Food & Drink',
    eventType: 'Physical Event',
    audience: ['All Ages', 'Youth', 'Families'],
    locationName: 'Galle Face Green',
    locationAddress: 'Colombo 03, Sri Lanka',
    city: 'Colombo',
    startDate: 'Aug 25, 2025',
    startTime: '4:00 PM',
    endDate: 'Aug 25, 2025',
    endTime: '10:00 PM',
    images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop'],
    isPaid: true,
    ticketPrice: 1500,
    additionalInfo: { foodAndBeverages: true, wheelchairAccessible: true, familyFriendly: true },
    status: 'Upcoming',
    viewsCount: 8900,
    interestedCount: 950,
    goingCount: 620,
    organizerId: 'organizer_host_1',
  },
  {
    _id: 'evt_3',
    id: 'evt_3',
    title: 'Galle Literary Festival',
    description: 'Celebration of international authors, poetry, discussions and workshops inside Galle Fort.',
    category: 'Arts & Festival',
    eventType: 'Physical Event',
    audience: ['Adults', 'Youth'],
    locationName: 'Galle Fort Cultural Center',
    locationAddress: 'Galle Fort, Sri Lanka',
    city: 'Galle',
    startDate: 'Sep 12, 2025',
    startTime: '9:00 AM',
    endDate: 'Sep 14, 2025',
    endTime: '6:00 PM',
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop'],
    isPaid: true,
    ticketPrice: 2500,
    additionalInfo: { foodAndBeverages: true, wheelchairAccessible: true, familyFriendly: false },
    status: 'Draft',
    viewsCount: 4200,
    interestedCount: 310,
    goingCount: 150,
    organizerId: 'organizer_host_1',
  },
];

@Injectable()
export class EventsService {
  private inMemoryEvents: any[] = [...INITIAL_SEED_EVENTS];

  constructor(
    @InjectModel(Event.name) private readonly eventModel?: Model<EventDocument>,
  ) {}

  private normalizeDoc(doc: any) {
    if (!doc) return null;
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
    const idStr = obj._id ? obj._id.toString() : obj.id;
    return {
      ...obj,
      _id: idStr,
      id: idStr,
    };
  }

  async create(createEventDto: CreateEventDto): Promise<any> {
    const newEventData = {
      ...createEventDto,
      status: createEventDto.status || 'Published',
      viewsCount: 0,
      interestedCount: 0,
      goingCount: 0,
      organizerId: createEventDto.organizerId || 'organizer_host_1',
      createdAt: new Date().toISOString(),
    };

    if (this.eventModel) {
      try {
        const createdEvent = new this.eventModel(newEventData);
        const saved = await createdEvent.save();
        const normalized = this.normalizeDoc(saved);
        this.inMemoryEvents.unshift(normalized);
        return normalized;
      } catch (err) {
        console.warn('Mongoose save fallback to in-memory store:', err);
      }
    }

    const newId = `evt_${Date.now()}`;
    const newInMemory = {
      ...newEventData,
      _id: newId,
      id: newId,
    };
    this.inMemoryEvents.unshift(newInMemory);
    return newInMemory;
  }

  async findAll(): Promise<any[]> {
    if (this.eventModel) {
      try {
        const docs = await this.eventModel.find().sort({ createdAt: -1 }).exec();
        if (docs && docs.length > 0) {
          const normalized = docs.map((d) => this.normalizeDoc(d));
          // Merge in seed items if not present
          const existingIds = new Set(normalized.map((n) => n.id));
          const extraSeeds = this.inMemoryEvents.filter((s) => !existingIds.has(s.id));
          return [...normalized, ...extraSeeds];
        }
      } catch (err) {
        console.warn('Mongoose find fallback to in-memory store:', err);
      }
    }
    return this.inMemoryEvents;
  }

  async findOrganizerEvents(organizerId: string): Promise<any[]> {
    const all = await this.findAll();
    return all;
  }

  async findOne(id: string): Promise<any> {
    if (this.eventModel) {
      try {
        if (id && id.length === 24) {
          const doc = await this.eventModel.findById(id).exec();
          if (doc) return this.normalizeDoc(doc);
        }
      } catch (err) {
        console.warn('Mongoose findOne error fallback:', err);
      }
    }
    const found = this.inMemoryEvents.find((e) => e._id === id || e.id === id);
    if (found) return found;
    return this.inMemoryEvents[0] || null;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<any> {
    let updatedDoc = null;
    if (this.eventModel && id && id.length === 24) {
      try {
        const updated = await this.eventModel
          .findByIdAndUpdate(id, updateEventDto, { new: true })
          .exec();
        if (updated) updatedDoc = this.normalizeDoc(updated);
      } catch (err) {
        console.warn('Mongoose update fallback:', err);
      }
    }

    const idx = this.inMemoryEvents.findIndex((e) => e._id === id || e.id === id);
    if (idx !== -1) {
      this.inMemoryEvents[idx] = { ...this.inMemoryEvents[idx], ...updateEventDto };
      return this.inMemoryEvents[idx];
    }

    if (updatedDoc) return updatedDoc;
    throw new NotFoundException(`Event with ID ${id} not found`);
  }

  async remove(id: string): Promise<any> {
    if (this.eventModel && id && id.length === 24) {
      try {
        await this.eventModel.findByIdAndDelete(id).exec();
      } catch (err) {
        console.warn('Mongoose delete error:', err);
      }
    }

    const idx = this.inMemoryEvents.findIndex((e) => e._id === id || e.id === id);
    if (idx !== -1) {
      const removed = this.inMemoryEvents.splice(idx, 1);
      return { success: true, removed: removed[0] };
    }
    return { success: true };
  }

  async duplicate(id: string): Promise<any> {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException(`Event with ID ${id} not found`);

    const duplicatedData: CreateEventDto = {
      title: `${existing.title} (Copy)`,
      description: existing.description,
      category: existing.category,
      eventType: existing.eventType,
      audience: existing.audience || ['All Ages'],
      locationName: existing.locationName,
      locationAddress: existing.locationAddress,
      city: existing.city,
      startDate: existing.startDate,
      startTime: existing.startTime,
      endDate: existing.endDate,
      endTime: existing.endTime,
      images: existing.images || [],
      isPaid: existing.isPaid || false,
      ticketPrice: existing.ticketPrice || 0,
      additionalInfo: existing.additionalInfo,
      status: 'Draft',
      organizerId: existing.organizerId,
    };
    return this.create(duplicatedData);
  }

  async getInsights(id: string): Promise<any> {
    const event = await this.findOne(id);
    return {
      eventSummary: event,
      viewsCount: event?.viewsCount || 12400,
      interestedCount: event?.interestedCount || 1200,
      goingCount: event?.goingCount || 850,
      interestOverTime: [
        { date: 'Jul 1', value: 450 },
        { date: 'Jul 15', value: 780 },
        { date: 'Aug 1', value: 920 },
        { date: 'Aug 15', value: 1550 },
      ],
      recentMessages: [
        { id: 'm1', sender: 'Nimal Perera', timeAgo: '2 hours ago', isOnline: true, text: 'Hi! Are there group discounts available?' },
        { id: 'm2', sender: 'Sahara Fernando', timeAgo: '5 hours ago', isOnline: true, text: 'Is parking available at the venue?' },
        { id: 'm3', sender: 'Tharindu Silva', timeAgo: '1 day ago', isOnline: true, text: 'Can I get more information about VIP tickets?' },
      ],
    };
  }
}
