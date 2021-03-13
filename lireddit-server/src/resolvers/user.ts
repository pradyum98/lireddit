import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from "type-graphql";
import { MyContext } from "../types";
import argon2 from "argon2";
import { User } from "../entities/User";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}


@ObjectType()
class UserResponse {
  @Field(() => [FieldError] , {nullable:true})
  errors?: FieldError[];
  @Field(() => User , {nullable: true})
  user?: User;
}

@Resolver()
export class UserResolver {
  @Mutation(() => User)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Arg("id") id: number,
    @Ctx() { em }: MyContext
  ): Promise<User> {
    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
      id: id,
    });
    await em.persistAndFlush(user);
    return user;
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User,{username:options.username});
    if(!user){
        return {
            errors:[{
                field : 'username',
                message : 'user not found'
            }]
        }
    }
    const valid = await argon2.verify(user.password,options.password);
    if(!valid){
        return {
            errors:[{
                field : 'username',
                message : 'Incorrect password'
            }]
        }
    }
    return {
        user
    };
  }
}