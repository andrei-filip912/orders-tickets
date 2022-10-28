import { TicketUpdatedListener } from "../ticket-updated-listener";
import { natsWrapper } from "../../../nats-wrapper";    
import { Ticket } from "../../../models/ticket";
import mongoose from "mongoose";
import { TicketUpdatedEvent } from "@frst-ticket-app/common";
import { Message } from 'node-nats-streaming';

const setup = async () => {
    // create a listener
    const listener = new TicketUpdatedListener(natsWrapper.client);

    // create and save ticket
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20
    });

    await ticket.save();

    // create fake data
    const data: TicketUpdatedEvent['data'] = {
        id: ticket.id,
        version: ticket.version + 1,
        title: 'new concert',
        price: 534,
        date: new Date(),
        location: 'sd',
        description: 'fff',
        userId: 'fsdfaa'
    };

    // create fake message (dirty fix to not implement trivial props)
    // @ts-ignore
    const msg: Message ={
        ack: jest.fn()
    }

    return { msg, data, ticket, listener };
}

test('should find, update, save a ticket', async () => {
    const { msg, data, ticket, listener} = await setup();

    await listener.onMessage(data, msg);

    const updatedTicket = await Ticket.findById(ticket.id);

    expect(updatedTicket!.title).toEqual(data.title);
    expect(updatedTicket!.price).toEqual(data.price);
    expect(updatedTicket!.version).toEqual(data.version);
});

test('should ack the message', async () => {
    const {msg, data, listener, ticket} = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
});

test('should not call ack while processing events out of order(skipped version number)', async () => {
    const{ msg, data, listener, ticket } = await setup();

    data.version = 10;
    try {
        await listener.onMessage(data, msg);
    } catch (err) {
        
    }
    expect(msg.ack).not.toHaveBeenCalled();

});