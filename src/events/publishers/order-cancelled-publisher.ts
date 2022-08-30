import { Subjects, Publisher, OrderCancelledEvent } from "@frst-ticket-app/common";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
    subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
}