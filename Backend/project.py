import time
import datetime
from flask import Flask, request
from flask_pymongo import PyMongo
from flask_cors import CORS, cross_origin

app = Flask(__name__)
app.config['MONGO_URI'] = 'mongodb://exceed_group03:n9tvpt6s@158.108.182.0:2255/exceed_group03'

cors = CORS(app)
mongo = PyMongo(app)

#myCollection = mongo.db.user

@app.route('/test', methods=['GET'])
@cross_origin()
def test():
    now = datetime.datetime.now()
    print(now)
    print(now.strftime("%A"))
    return {}

#user
@app.route('/create_user', methods=['POST'])
@cross_origin()
def insert_one():
    myCollection = mongo.db.user
    data = request.json
    ts = time.time()
    
    last_user = myCollection.find_one(sort=[("user_id", -1)])
    #last_id = (last_user == None) ? 1 : last_user['user_id']

    if(last_user == None):
        last_id = 0
    else:
        last_id = last_user["user_id"]
    #print(last_id)
    data["last_update_timestamp"] = ts
    data["user_id"] = last_id + 1

    myCollection.insert_one(data)
    return {'result': 'Create succesfully'}

@app.route('/update_status', methods=['POST'])
@cross_origin()
def update():
    data = request.json
    Id = request.args.get('user_id')
     
    ts = time.time()
    filt = {"user_id": int(Id)}
    update_status = {"$set": {
        'status': data['status'],
        'last_update_timestamp': ts
        }}
    #print(filt, update_status)
    myCollection = mongo.db.user
    myCollection.update_one(filt, update_status)
    return {'result': 'update succesfully'}

@app.route('/response', methods=['GET'])
@cross_origin()
def response():
    myCollection = mongo.db.messages
    ID = request.args.get("user_id")
    filt = {"user_id": int(ID), "type": "live" }

    query = myCollection.find_one(filt)
    output = {}
    output["message"] = query["message"]
    output["response"] = query["response"]
    output["sent"] = query["sent"]
    return output

@app.route('/all_user', methods=['GET'])
@cross_origin()
def find_all():
    myCollection = mongo.db.user
    all_user = myCollection.find()
    
    output = []

    for ele in all_user:
        output.append({
            "user_id": ele["user_id"],
            "name": ele["name"],
            "age": ele["age"],
            "address": ele["address"],
            "status": ele["status"],
            "last_update_timestamp": ele["last_update_timestamp"]
            })

    return {'result': output}

#message
@app.route('/new_msg', methods=['POST'])
@cross_origin()
def new_msg():
    myCollection = mongo.db.messages
    user_id = request.args.get("user_id")
    data = request.json
    filt = {"user_id": int(user_id), "type": "live"}
    query = myCollection.find_one(filt)
    if(query):
        update_msg = { "$set": {
            "message": data["message"],
            "sent": False,
            "response": None
        }}

        myCollection.update_one(filt,update_msg)
        return {"result": "Update successfully"}
    else:
        last_msg = myCollection.find_one(sort=[("msg_id", -1)])
 
        if(last_msg == None):
            last_id = 0
        else:
            last_id = last_msg["msg_id"]

        data["user_id"] = int(user_id)
        data["msg_id"] = last_id + 1
        data["hasResponse"] = True
        data["response"] = None
        data["sent"] = False
        data["type"] = "live"
        myCollection.insert_one(data)
        return{'result': 'Create successfully'}
    
@app.route('/get_live', methods=['GET'])
@cross_origin()
def get_live():
    myCollection = mongo.db.messages
    user_id = request.args.get("user_id")

    filt = {"user_id": int(user_id), "type": "live", "sent": False}

    query = myCollection.find_one(filt)
    output = {}
    if (query):
        output["message"] = query["message"]
        output["msg_id"] = query["msg_id"]
 
    update_sent = { "$set": {
        'sent': True
    }}
    myCollection.update_one(filt,update_sent)

    return output

@app.route('/get_schedule', methods=['GET'])
@cross_origin()
def get_schedule():
    myCollection = mongo.db.messages
    user_id = request.args.get("user_id")
    
    now = datetime.datetime.now()
    now_hour = now.hour + 7
    now_min = now.minute
    now_day = now.strftime("%A")
    if(now_hour >= 24):
        now_hour = now_hour - 24
        if(now_day == "Monday"):
            now_day = "Tuesday"
        elif(now_day == "Tuesday"):
            now_day = "Wednesday"
        elif(now_day == "Wednesday"):
            now_day = "Thursday"
        elif(now_day == "Thursday"):
            now_day = "Friday"
        elif(now_day == "Friday"):
            now_day = "Saturday"
        elif(now_day == "Saturday"):
            now_day = "Sunday"
        elif(now_day == "Sunday"):
            now_day = "Monday"
    
    #now_day = "Friday"

    filt = {"user_id": int(user_id), "type": "schedule", "day": now_day, "hour": now_hour, "minute": now_min}
    
    query = myCollection.find(filt)

    output = []
    for ele in query:
        output.append({
            "message": ele["message"],
            "msg_id": ele["msg_id"]
            })
    
    
    return {'result': output }

@app.route('/create_schedule', methods=['POST'])
@cross_origin()
def input_schedule():
    myCollection = mongo.db.messages
    data = request.json
    user_id = request.args.get("user_id")
    last_msg = myCollection.find_one(sort=[("msg_id", -1)])
    
    if(last_msg == None):
        last_id = 0
    else:
        last_id = last_msg["msg_id"]
    
    data["user_id"] = int(user_id)
    data["msg_id"] = last_id + 1
    data["hasResponse"] = False
    data["response"] = None
    
    #now = datetime.datetime.now()
     
    #print(now.strftime("%A"), now.hour, now.minute, now.second)
    myCollection.insert_one(data) 
    return { 'result': "Create successful"}

@app.route('/delete_schedule', methods=['DELETE'])
@cross_origin()
def delete_schedule():
    myCollection = mongo.db.messages
    msg_id = request.args.get("msg_id")
    filt = {"msg_id": int(msg_id), "type": "schedule"}
    myCollection.delete_one(filt)
    
    return {'result': 'Delete successfully'}


@app.route('/msg', methods=['GET'])
@cross_origin()
def get_msg():
    myCollection = mongo.db.messages
    ID = request.args.get("user_id")
    filt = {"user_id": int(ID) }

    query = myCollection.find(filt)

    output = []
    for ele in query:
        if(ele["type"] == "live"):
            output.append({
                "message": ele["message"],
                "msg_id": ele["msg_id"],
                "type": ele["type"]
            })
        else:
            output.append({
                "message": ele["message"],
                "msg_id": ele["msg_id"],
                "type": ele["type"],
                "day": ele["day"], 
                "hour": ele["hour"], 
                "minute": ele["minute"], 
                "second": ele["second"]
            })
    
    return {"result": output}

#secure
@app.route('/create_secure', methods=['POST'])
@cross_origin()
def input_secure():
    myCollection = mongo.db.gas_gyro
    data = request.json
    myCollection.insert_one(data)
    return {'result': 'Create successfully'}

@app.route('/update_gyro', methods=['POST'])
@cross_origin()
def update_gyro():
    data = request.json
    ID = request.args.get('user_id')
    filt = {"user_id": int(ID)}
    update_gyro = {"$set": {
        "gyro": data['gyro'],
        "timestamp_gyro": time.time()
        }}
    myCollection = mongo.db.gas_gyro
    myCollection.update_one(filt, update_gyro)

    myCollection = mongo.db.user
    update = {"$set": {
        "status": "danger"
        }}
    #print(filt, update)
    myCollection.update_one(filt, update)

    return {"result": "update successfully"}
    
@app.route('/update_gas', methods=['POST'])
@cross_origin()
def update_gas():
    data = request.json
    ID = request.args.get('user_id')
    filt = {"user_id": int(ID)}
    update_gas = {"$set": {
        "gas": data['gas'],
        "timestamp_gas": time.time()
        }}
    myCollection = mongo.db.gas_gyro
    myCollection.update_one(filt, update_gas)
    myCollection = mongo.db.user
    update = {"$set": {
        "status": "danger"
        }}
    myCollection.update_one(filt, update)
    return {"result": "update successfully"}

@app.route('/get_secure', methods=['GET'])
@cross_origin()
def find_secure():
    myCollection = mongo.db.gas_gyro
    ID = request.args.get("user_id")
    filt = {"user_id": int(ID)}
    query = myCollection.find_one(filt)
    
    output = {
            "user_id": query["user_id"],
            "gyro": query["gyro"],
            "timestamp_gyro": query["timestamp_gyro"],
            "gas": query["gas"],
            "timestamp_gas": query["timestamp_gas"]
            }

    return {'result': output}

#yer/no
@app.route('/reply', methods=['POST'])
@cross_origin()
def reply():
    myCollection = mongo.db.messages
    data = request.json
    msg_id = data["msg_id"]
    response = data["response"]
    print(data)
    filt = {"msg_id": int(msg_id)}

    update = {"$set": {
        "response": response
        }}
    myCollection.update_one(filt, update)
    return {"result": "Reply successfully"}


if __name__ == "__main__":
    app.run(host='0.0.0.0', port='3000', debug=True)
