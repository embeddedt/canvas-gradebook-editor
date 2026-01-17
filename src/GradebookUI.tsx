import useSWR from "swr"
import { NativeSelect } from "./NativeSelect"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocalStorageValue } from "@react-hookz/web";
import { NativeAutocomplete } from "./NativeAutocomplete";
import { updateCanvasForm } from "./fetch";

interface Course {
    id: number;
    name: string;
    enrollments: {
        type: string;
        role: string;
        enrollment_state: string;
    }[];
}

interface User {
    id: number;
    name: string;
    sortable_name: string;
    integration_id: number;
}

interface Assignment {
    id: number;
    name: string;
    description: string;
    points_possible: number;
}

interface Submission {
  id: number;
  assignment_id: number;
  course_id: number;
  user_id: number;
  submission_type: string[];
  workflow_state: string;
  grade: string | null;
  score: number | null;
};

function GradebookUI() {
    const { data: courses } = useSWR<Course[]>('/api/v1/courses?per_page=100', {
        revalidateOnFocus: false
    })
    const selectedCourse = useLocalStorageValue<string>("quercus-gradebook-selected-course");
    const courseOptions = useMemo(() => {
        if (courses) {
            return courses.filter(c => c.id && c.name && c.enrollments.find(e => e.type !== "student")).map(c => ({
                value: String(c.id),
                label: c.name ?? ""
            }))
        } else {
            return [];
        }
    }, [courses]);
    const selectedCourseInfo = useMemo(() => {
        const id = Number(selectedCourse.value);
        return courses?.find(c => c.id == id);
    }, [courses, selectedCourse.value]);
    return <div className="gradebook-main">
        <p><b>Course:</b></p>
        <NativeSelect value={selectedCourse.value ?? ""} onChange={selectedCourse.set} options={courseOptions}/>
        {selectedCourseInfo && <CourseGradebook course={selectedCourseInfo}/>}
    </div>
}

function CourseGradebook({course}: {course: Course}) {
    const { data: rawUsers, isLoading: usersLoading } = useSWR<User[]>(`/api/v1/courses/${course.id}/users?enrollment_type[]=student&per_page=1000`, {
        revalidateOnFocus: false
    });
    const courseUsers = useMemo(() => {
        return rawUsers?.sort((a, b) => a.name.localeCompare(b.name));
    }, [ rawUsers ]);
    const { data: courseAssignments, isLoading: assignmentsLoading } = useSWR<Assignment[]>(`/api/v1/courses/${course.id}/assignments?per_page=1000`, {
        revalidateOnFocus: false
    });
    const selectedAssignment = useLocalStorageValue<string>("quercus-gradebook-selected-assignment-" + course.id);
    const [user, setUser] = useState<string>("");
    useEffect(() => {
        setUser("");
    }, [course.id]);
    const assignmentOptions = useMemo(() => {
        return courseAssignments?.map(a => ({
            value: String(a.id),
            label: a.name
        })) ?? [];
    }, [courseAssignments]);
    const userOptions = useMemo(() => {
        return courseUsers?.map(u => ({
            value: `${u.name} (${u.integration_id})`,
        })) ?? [];
    }, [courseUsers]);
    const userObj = useMemo(() => {
        if (courseUsers) {
            const o = userOptions.findIndex(u => u.value == user);
            if (o != -1) {
                return courseUsers[o];
            }
        }
        return null;
    }, [ user, courseUsers, userOptions ]);
    const assignmentObj = useMemo(() => {
        const id = Number(selectedAssignment.value);
        return courseAssignments?.find(a => a.id == id);
    }, [ courseAssignments, selectedAssignment.value ]);
    const clearUser = useCallback(() => {
        setUser("");
    }, [setUser]);
    return <>
        {assignmentsLoading ? <p><b>Loading assignments</b></p> : <>
            <p><b>Assignment:</b></p>
            <NativeSelect value={selectedAssignment.value ?? ""} onChange={selectedAssignment.set} options={assignmentOptions}/>
        </>}
        {usersLoading ? <p><b>Loading users</b></p> : <>
            <p><b>User:</b> <button onClick={clearUser}>clear</button></p>
            <NativeAutocomplete value={user} onChange={setUser} options={userOptions}/>
        </>}
        {userObj && assignmentObj && <GradeEditor key={course.id + "-" + userObj.id + "-" + assignmentObj.id} course={course} user={userObj} assignment={assignmentObj}/>}
    </>;
}

function GradeEditor({course, user, assignment}: {course: Course, user: User; assignment: Assignment;}) {
    const { data: submission, mutate: reloadSubmission } = useSWR<Submission>(`/api/v1/courses/${course.id}/assignments/${assignment.id}/submissions/${user.id}?include[]=submission`);
    const [userScore, setUserScore] = useState<string|null>(null);
    const [isSaving, setSaving] = useState<boolean>(false);
    const userScoreFloat = userScore !== null ? parseFloat(userScore) : NaN;
    const needsSaving = submission && userScore !== null && userScore.length > 0 && !isNaN(userScoreFloat) && userScoreFloat != submission.score && userScoreFloat <= assignment.points_possible;
    useEffect(() => {
        if (userScore === null && typeof submission?.score !== 'undefined' && submission.score !== null) {
            setUserScore(String(submission.score));
        }
    }, [submission?.score, userScore]);
    const saveScore = useCallback(async() => {
        setSaving(true);
        try {
            const formData = new URLSearchParams();
            formData.append("submission[posted_grade]", userScoreFloat.toFixed(2));
            await updateCanvasForm(`/api/v1/courses/${course.id}/assignments/${assignment.id}/submissions/${user.id}`, "PUT", formData);
            await reloadSubmission()
        } catch(e) {
            console.error(e);
            window.alert("An error was encountered while updating grade: " + e);
        } finally {
            setSaving(false);
        }
    }, [course.id, assignment.id, user.id, userScoreFloat]);

    if (!submission) {
        return <p><b>Loading grade</b></p>;
    }

    return <>
        <p><b>Grade:</b></p>
        <div className="grade-line">
            <input className="user-score" type="number" step="any" value={userScore ?? ""} onChange={e => setUserScore(e.target.value)}/>
            <span className="grade-divider">/</span>
            <span className="points-possible">{assignment.points_possible}</span>
            {needsSaving && <button disabled={isSaving} onClick={saveScore}>Save</button>}
        </div>
    </>
}

export default GradebookUI