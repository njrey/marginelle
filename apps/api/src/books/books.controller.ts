import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { BooksService } from "./books.service";

export class CreateBookDto {
  title: string;
  author?: string;
}

@Controller("books")
export class BooksController {
  constructor(private svc: BooksService) { }
  @Get() list() { return this.svc.list(); }
  @Get(":id") findOne(@Param("id") id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() createBookDto: CreateBookDto) {
    return this.svc.create(createBookDto);
  }
}
