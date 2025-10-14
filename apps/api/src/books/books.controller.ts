import { Controller, Get, Post, Body } from "@nestjs/common";
import { BooksService } from "./books.service";

export class CreateBookDto {
  title: string;
  author?: string;
}

@Controller("books")
export class BooksController {
  constructor(private svc: BooksService) { }
  @Get() list() { return this.svc.list(); }
  @Post() create(@Body() createBookDto: CreateBookDto) {
    return this.svc.create(createBookDto);
  }
}
