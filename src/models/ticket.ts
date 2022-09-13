import mongoose from 'mongoose';
import { Order, OrderStatus } from './order';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

// it is a bad practice to include this file in the common module since the
// definition of a ticket is specific to each service (this service does not
// need the other properties of a ticket)

interface TicketAttributes {
    id: string;
    title: string;
    price: number;
}

interface TicketDocument extends mongoose.Document {
    title: string;
    price: number;
    version: number;
    isReserved() : Promise<boolean>;
}

interface TicketModel extends mongoose.Model<TicketDocument> {
    build(attributes: TicketAttributes): TicketDocument;
    findByEvent(event: { id: string, version: number}) : Promise<TicketDocument | null>;
}

const ticketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        }
    }
});

ticketSchema.set('versionKey', 'version');
ticketSchema.plugin(updateIfCurrentPlugin);

ticketSchema.statics.build = (attributes: TicketAttributes) => {
    return new Ticket({
        _id: attributes.id,// using this to solve issue created by renaming _id to id
        title: attributes.title,
        price: attributes.price,
    });
}
ticketSchema.statics.findByEvent = ( event: { id: string, version: number }) => {
    return Ticket.findOne({
        _id: event.id,
        version: event.version -1,
    });
};
// critical to use function keyword so this keyword will work properly
ticketSchema.methods.isReserved = async function() {
    const existingOrder = await Order.findOne({
        ticket: this, // this refers to the current ticket
        status: {
            $in: [
                OrderStatus.Created,
                OrderStatus.AwaitingPayment,
                OrderStatus.Complete
            ]
        }
    });
    
    if(existingOrder) {
        return true;
    }
    return false;
}

const Ticket = mongoose.model<TicketDocument, TicketModel>('Ticket', ticketSchema);

export { Ticket, TicketDocument };