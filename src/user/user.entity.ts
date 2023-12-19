import {Entity,Column,PrimaryGeneratedColumn} from 'typeorm'
import { Gender, IUser, UserRole } from './user.interface';
import { compare, compareSync, genSalt, hash } from 'bcryptjs';



@Entity('users')
export class UserEntity implements IUser {

    @PrimaryGeneratedColumn()
    id:number;


    @Column()
    name:string;

    @Column({unique:true})
    email:string;

    @Column()
    password:string;


    @Column("enum",{enum:Gender})
    gender:Gender;

    @Column("enum",{enum:UserRole})
    role: UserRole;

    constructor(user:Omit<IUser,"password">){
        if(user){
            this.id = user.id;
            this.name = user.name;
            this.email = user.email;
            this.role = user.role;
            this.gender = user.gender
        }
    }


    public async setPassword(password:string) {
        const salt = await genSalt(10);
        this.password = await hash(password,salt);
        return this;
    }

    public async validatePassword(password:string,hashPassword:string){
        let res = compareSync(password,hashPassword);
        return res;
    }
}
