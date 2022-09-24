import { CommandType } from "../../src/Typings/Command";

export class Command {
  constructor(commandOptions: CommandType) {
    Object.assign(this, commandOptions);
  }
}