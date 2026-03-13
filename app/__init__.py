import os
from flask import Flask, render_template, request, jsonify, redirect, session
import bcrypt
# from flask_bcrypt import Bcrypt
import json

from app.models import session_scope, User, Information, Weddinghall, Transportation, Account
from app.config import secret_key, bcrypt_level
from app.views.index import geocoding


from app.views.template_dummy import groom_dict, bride_dict, wedding_schedule_dict, message_templates_dict, transport_list, guestbook_list, image_list, bank_acc
groom_dict = groom_dict # 신랑 데이터
bride_dict = bride_dict # 신부 데이터
wedding_schedule_dict = wedding_schedule_dict # 장소와 시간 데이터
message_templates_dict = message_templates_dict # 글귀 데이터
transport_list = transport_list # 교통 수단 데이터
guestbook_list = guestbook_list # 방명록 데이터
image_list = image_list # 이미지 데이터
bank_acc = bank_acc # 계좌번호 데이터


def create_app():
    app = Flask(__name__)
    # 앱 설정, 라우트, 확장 등을 여기에 추가
    
    
    
    app.config['SECRET_KEY'] = secret_key
    app.config['BCRYPT_LEVEL'] = bcrypt_level

    # bcrypt_app = Bcrypt(app) 


    @app.route("/")
    def index():
        if request.method == 'GET':
            return render_template('/index.html') 
        
    @app.route("/invitation")
    def invitation():
        with session_scope() as db_session:
            test = db_session.query(User).filter(User.id == 1).first()
            # name = test.name
            # 더미 존
            from app.views.template_dummy import groom_dict, bride_dict, wedding_schedule_dict, message_templates_dict, guestbook_list, image_list, transport_list
            groom_dict = groom_dict # 신랑 데이터
            bride_dict = bride_dict # 신부 데이터
            wedding_schedule_dict = wedding_schedule_dict # 장소와 시간 데이터
            message_templates_dict = message_templates_dict # 글귀 데이터
            transport_list = transport_list # 교통 수단 데이터
            guestbook_list = guestbook_list # 방명록 데이터
            
            image_list = image_list # 이미지 데이터   
        return render_template('invitation.html',  
                            groom_dict=groom_dict, 
                            bride_dict=bride_dict,
                            wedding_schedule_dict=wedding_schedule_dict,
                            message_templates_dict=message_templates_dict,
                            transport_list=transport_list,
                            guestbook_list=guestbook_list,
                            image_list=image_list,
                            bank_acc=bank_acc
                            )


    @app.route("/login", methods=['GET', 'POST'])
    def login():
        if request.method == 'GET':
            return render_template('/login.html')
        
        if request.method == 'POST':
            print("comming?")
            # data = request.get_json()
            json_data = json.loads(request.form.get('json'))
            print("@#$",type(json_data))

            groom_dict = json_data['groom_dict']
            bride_dict = json_data['bride_dict']
            wedding_dict = json_data['wedding_schedule_dict']
            message_dict = json_data['message_templates_dict']
            guestbook_password = json_data['guestbook_password']
            bank_acc = json_data['bank_acc']
            transport_list = json_data['transport_list']
            # print("@@groom_dict",groom_dict)
            # print("@@bride_dict",bride_dict)
            print("@@wedding_schedule_dict",wedding_dict)
            print("@@message_templates_dict",message_dict)
            print("@@guestbook_password",guestbook_password)
            print("@@bank_acc",bank_acc)
            print("@@transport_list",transport_list)

            with session_scope() as db_session:
                # 신랑 / 신부 가족 정보
                key_list = ['firstname', 'lastname', 'phoneNum', 'fatherFirstName', 'fatherFirstName', 'fatherPhoneNum', 'motherFirstName', 'motherLastName', 'motherPhoneNum']
                for i, d in enumerate([groom_dict, bride_dict]):
                    for check in range(0, 8, 3):
                        info_item = Information(d[key_list[check]], d[key_list[check+1]], d[key_list[check+2]], 5, 1+i if check == 0 else 3+i if check == 3 else 5+i)
                        db_session.add(info_item)
                        db_session.commit()
                        db_session.refresh(info_item)

                # 웨딩홀 정보
                wedding_hall_item = Weddinghall(wedding_dict['hall_name'], wedding_dict['hall_addr'], wedding_dict['hall_floor'], wedding_dict['date'], wedding_dict['time_hour']+wedding_dict['time_minute'], 5, 0, 0)
                db_session.add(wedding_hall_item)
                db_session.commit()
                db_session.refresh(wedding_hall_item)

                # 메시지
                # message_dict 위에 시는 안보내는지?

                # 방명록 비밀번호 업데이트 -> 디폴트값 0000
                user_item = db_session.query(User).filter(User.id == 5).first()
                user_item.guestbook_pw = guestbook_password
                db_session.commit()

                # 계좌
                for i, bank in enumerate(bank_acc):
                    for b in bank['list']:
                        account_item = Account(b['bank'], b['number'], b['name'], i+1, 5)
                        db_session.add(account_item)
                        db_session.commit()
                        db_session.refresh(account_item)

                # 대중교통
                for i, t in enumerate(transport_list):
                    transport_item = Transportation(t['contents_transport'], 5, i+1)
                    db_session.add(transport_item)
                    db_session.commit()
                    db_session.refresh(transport_item)


            print(request.files)
            main_img_file = request.files['main_img']
            sub_img_file = request.files['sub_img']
            # gallery_img_files = [v for k, v in request.files.items() if k.startswith('gallery_img')]
            gallery_img = {}
            gallery_img_sm = {}

            for k, v in request.files.items():
                if k.startswith('gallery_img') and k.endswith('[img]'):
                    idx = int(k.split('[')[1].split(']')[0])
                    gallery_img[idx] = v
                elif k.startswith('gallery_img') and k.endswith('[img_sm]'):
                    idx = int(k.split('[')[1].split(']')[0])
                    gallery_img_sm[idx] = v

            # 정렬
            gallery_img = [v for k, v in sorted(gallery_img.items())]
            gallery_img_sm = [v for k, v in sorted(gallery_img_sm.items())]

            print('main_img_file,',main_img_file)
            print('sub_img_file,',sub_img_file)
            print('gallery_img,',gallery_img)
            print('gallery_img_sm,',gallery_img_sm)
            # if 'main_img' in request.files:
            #   file = request.files['main_img']
            # print(f'{file.filename} uploaded successfully')


            import os

            IMAGES_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images')
            folder_name = '5'

            folder_path = os.path.join(IMAGES_FOLDER, folder_name)
            if not os.path.exists(folder_path):
                os.makedirs(folder_path)

            if main_img_file:
                # filename = file.filename
                main_img_file.save(folder_path+"/"+'main_img.jpg')



            json_data = request.form.get('json')
            if json_data:
                data = json.loads(json_data)
                print(data)
                
                id = data['id']
                pw = data['password']

                with session_scope() as db_session:
                    user_item = db_session.query(User)\
                                        .filter(User.user_id == id)\
                                        .first()
                    
                    print("user",user_item)
                    if user_item and bcrypt.checkpw(pw.encode('utf-8'), user_item.user_pw.encode('utf-8')):   # 로그인 성공
                        print("로그인성공")
                        session['user']=user_item.user_id
                        response = jsonify({'message': 'Success'})
                        response.status_code = 200
                    else:           # 로그인 실패
                        print("로그인실패")
                        response = jsonify({'message': 'Success'})
                        response.status_code = 401
                    
                    return response
        
    @app.route("/register", methods=['GET', 'POST'])
    def register():
        if request.method == 'GET':
            return render_template('/register.html')
        
        if request.method == 'POST':
            data = request.get_json()
            print(data)
            
            name = data['name']
            id = data['id']
            pwd = data['password']
            email = data['email']

            with session_scope() as db_session:
                user_item = User(name, id, pwd, email)
                db_session.add(user_item)
                db_session.commit()
                db_session.refresh(user_item)
            response = jsonify({'message': 'Success'})
            response.status_code = 200
            return response


    @app.route("/create", methods=['GET', 'POST'])
    def create():
        if request.method == 'GET':
            if 'user' in session:
                user_id = session['user']
                print('user,',user_id)
            else:
                return render_template('/login.html') 
            
            # from views.template_dummy_for_html import groom_dict, bride_dict, bank_acc, wedding_schedule_dict, message_templates_dict, transport_list, guestbook_list
            from app.views.template_dummy import groom_dict, bride_dict, bank_acc, wedding_schedule_dict, message_templates_dict, transport_list, guestbook_list
            groom_dict = groom_dict
            bride_dict = bride_dict
            bank_acc = bank_acc
            wedding_schedule_dict = wedding_schedule_dict
            message_templates_dict = message_templates_dict
            guestbook_list = guestbook_list
            return render_template('/create.html',  
                                groom_dict=groom_dict, 
                                bride_dict=bride_dict,
                                wedding_schedule_dict=wedding_schedule_dict,
                                message_templates_dict=message_templates_dict,
                                transport_list=transport_list,
                                guestbook_list=guestbook_list,
                                image_list=image_list,
                                bank_acc=bank_acc)
            
        if request.method == 'POST':
            print("comming?")
            # json_data = request.get_json()
            json_data = json.loads(request.form.get('json'))
            print("@#$",type(json_data))

            groom_dict = json_data['groom_dict']
            bride_dict = json_data['bride_dict']
            wedding_dict = json_data['wedding_schedule_dict']
            message_dict = json_data['message_templates_dict']
            guestbook_password = json_data['guestbook_password']
            bank_acc = json_data['bank_acc']
            transport_list = json_data['transport_list']
            # print("@@groom_dict",groom_dict)
            # print("@@bride_dict",bride_dict)
            print("@@wedding_schedule_dict",wedding_dict)
            print("@@message_templates_dict",message_dict)
            print("@@guestbook_password",guestbook_password)
            print("@@bank_acc",bank_acc)
            print("@@transport_list",transport_list)

            with session_scope() as db_session:
                # 신랑 / 신부 가족 정보
                key_list = ['firstname', 'lastname', 'phoneNum', 'fatherFirstName', 'fatherFirstName', 'fatherPhoneNum', 'motherFirstName', 'motherLastName', 'motherPhoneNum']
                for i, d in enumerate([groom_dict, bride_dict]):
                    for check in range(0, 8, 3):
                        info_item = Information(d[key_list[check]], d[key_list[check+1]], d[key_list[check+2]], 5, 1+i if check == 0 else 3+i if check == 3 else 5+i)
                        db_session.add(info_item)
                        db_session.commit()
                        db_session.refresh(info_item)

                # 웨딩홀 정보
                wedding_hall_item = Weddinghall(wedding_dict['hall_name'], wedding_dict['hall_addr'], wedding_dict['hall_floor'], wedding_dict['date'], wedding_dict['time_hour']+wedding_dict['time_minute'], 5, 0, 0)
                db_session.add(wedding_hall_item)
                db_session.commit()
                db_session.refresh(wedding_hall_item)

                # 메시지
                # message_dict 위에 시는 안보내는지?

                # 방명록 비밀번호 업데이트 -> 디폴트값 0000
                user_item = db_session.query(User).filter(User.id == 5).first()
                user_item.guestbook_pw = guestbook_password
                db_session.commit()

                # 계좌
                # 계좌 디비 좀 수정해야할듯

                # 대중교통
                for i, t in enumerate(transport_list):
                    transport_item = Transportation(t['contents_transport'], 5, i+1)
                    db_session.add(transport_item)
                    db_session.commit()
                    db_session.refresh(transport_item)




            print(request.files)
            main_img_file = request.files['main_img']
            sub_img_file = request.files['sub_img']
            # gallery_img_files = [v for k, v in request.files.items() if k.startswith('gallery_img')]
            gallery_img = {}
            gallery_img_sm = {}

            for k, v in request.files.items():
                if k.startswith('gallery_img') and k.endswith('[img]'):
                    idx = int(k.split('[')[1].split(']')[0])
                    gallery_img[idx] = v
                elif k.startswith('gallery_img') and k.endswith('[img_sm]'):
                    idx = int(k.split('[')[1].split(']')[0])
                    gallery_img_sm[idx] = v

            # 정렬
            gallery_imgs = [v for k, v in sorted(gallery_img.items())]
            gallery_img_sms = [v for k, v in sorted(gallery_img_sm.items())]

            # print('main_img_file,',main_img_file)
            # print('sub_img_file,',sub_img_file)
            # print('gallery_img,',gallery_img)
            # print('gallery_img_sm,',gallery_img_sm)
            

            
            # ============================================================================
            # 서버에 이미지 저장 코드 완료 
            # 클레어... 저는 대충 하드코딩했는데 이거 함수 만들어서 하면 코드 깔끔해질 듯 부탁드려요~
            # 서버에 계속 파일 만들수 없으니 디비랑 연동 후 주석 제거해서 사용하기
            # 이미지 파일명은 아마 프론트에서 처리했던거 같아요~ 그냥 디비에 그대로 넣기만 하면될듯
            # user_id = session['user']
            # UPLOAD_FOLDER = 'app/static/images/users/'
            # upload_path = os.path.join(UPLOAD_FOLDER, user_id)
            # if not os.path.exists(upload_path):
            #     os.makedirs(upload_path) # app/static/images/users/user_id 가 없으면 폴더 생성        
            # main_img_file.save(os.path.join(upload_path, main_img_file.filename))
            # sub_img_file.save(os.path.join(upload_path, sub_img_file.filename))
            # 
            # upload_path = os.path.join(UPLOAD_FOLDER, user_id+'/gallery_img')
            # if not os.path.exists(upload_path):
            #     os.makedirs(upload_path)
            # for gallery_img in gallery_imgs:
            #     gallery_img.save(os.path.join(upload_path, gallery_img.filename))
            #     
            # upload_path = os.path.join(UPLOAD_FOLDER, user_id+'/gallery_img_sm')
            # if not os.path.exists(upload_path):
            #     os.makedirs(upload_path)
            # for gallery_img_sm in gallery_img_sms:
            #     gallery_img_sm.save(os.path.join(upload_path, gallery_img_sm.filename))
            # ============================================================================
            
            # ===============================================================
            # 클레어 브랜치 개발용으로 하나 더 만들었는데 develop 풀받아서 여기서 작업해주세요
            # main 브랜치 데이터매니티처럼 실서버에서만 풀 받아서 작업하는 식으로 하는게 좋을 듯 합니다
            # 결론 develop 풀 받고 작업하고 develop에 푸쉬 해주세여
            # ===============================================================
            json_data = request.form.get('json')
            if json_data:
                data = json.loads(json_data)
                print(data)
        response = jsonify({
            'message': 'Success'
        })
        response.status_code = 200
        return response


    @app.route("/search_geocoding", methods=['GET', 'POST'])
    def search_geocoding():
        if request.method == 'POST':
            data = request.get_json()
            address = data['address']
            lat_lng = geocoding(address);
            print(address, lat_lng)
            response = jsonify({
                'data' : {
                    'lat_lng' : lat_lng , 
                    'address' : address
                },
                'message': 'Success'
                })
            response.status_code = 200
            return response

    @app.route("/set_gusetbook", methods=['GET', 'POST'])
    def set_gusetbook():
        if request.method == 'POST':
            data = request.get_json()
            name = data['name']
            password = data['password']
            content = data['content']
            # 클레어 방명록 추가 ("created_at":"2021.08.08" 이것도 같이요!!)
            print(name, password, content)
            response = jsonify({
                'message': 'Success'
            })
            response.status_code = 200
            return response

    @app.route("/delete_gusetbook", methods=['GET', 'POST'])
    def delete_gusetbook():
        if request.method == 'POST':
            data = request.get_json()
            password = data['password']
            id = data['id']
            print('password,',password)
            print('id,',id)
            # 클레어 방명록 삭제 쿼리 부탁드립니다~
            response = jsonify({
                'message': 'Success'
            })
            response.status_code = 200
            return response
        
    @app.route('/logout')
    def logout():
        session.pop('user', None)
        return render_template('/login.html') 
        
        
        
    # @app.route("/create_account", methods=['GET', 'POST'])
    # def create_account():
    #     name = request.form.get('name')
    #     id = request.form.get('id')
    #     pwd = request.form.get('pwd')
    #     email = request.form.get('email')

    #     with session_scope() as db_session:
    #             user_item = User(name, id, pwd, email)
    #             db_session.add(user_item)
    #             db_session.commit()
    #             db_session.refresh(user_item)

    #     return render_template('/create.html')
    return app
