import { Publisher, OrderCreatedEvent, Subjects } from "@frst-ticket-app/common";

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
    subject: Subjects.OrderCreated = Subjects.OrderCreated;
}