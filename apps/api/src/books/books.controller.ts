import { Controller, Get } from "@nestjs/common";
import { BooksService } from "./books.service";

@Controller("books")
export class BooksController {
	constructor(private svc: BooksService) { }
	@Get() list() { return this.svc.list(); }
}
