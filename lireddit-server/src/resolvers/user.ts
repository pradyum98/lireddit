import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
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
  @Query(() => User,{nullable:true})
  async me(
    @Ctx() { em , req }: MyContext
  ) : Promise <User | null>{
    if(!req.session.userId){
      return null;
    }

    const user = await em.findOne(User , {id:req.session.userId});
    return user;
  }



  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Arg("id") id: number,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    if(options.username.length <= 2){
      return {
        errors: [
          {
            field: 'username',
            message: 'username length should be greater than 2'
          }
        ]
      }
    }

    if(options.password.length <= 3){
      return {
        errors: [
          {
            field: 'password',
            message: 'password length should be greater than 3'
          }
        ]
      }
    }
    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
      id: id,
    });
    try{
      await em.persistAndFlush(user);
    } catch (err){
      return {
        errors: [
          {
            field: 'username',
            message: 'username already exists.'
          }
        ]
      }
    }
    return {
      user
    };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em , req}: MyContext
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

    req.session.userId = user.id;
    return {
        user
    };
  }
}
