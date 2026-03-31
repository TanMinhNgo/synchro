import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, lowercase: true, trim: true, unique: true })
  email!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  passwordHash?: string;

  @Prop({
    type: {
      google: {
        id: { type: String },
      },
    },
    default: {},
  })
  providers!: {
    google?: { id: string };
  };
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ 'providers.google.id': 1 }, { unique: true, sparse: true });
